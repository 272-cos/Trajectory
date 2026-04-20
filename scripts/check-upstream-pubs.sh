#!/usr/bin/env bash
# check-upstream-pubs.sh
# Deploy-time drift check for upstream USAF publications (DAFMAN + PFRA charts).
#
# What it does:
#   1. Scrapes the AFPC fitness parent page.
#   2. Matches each source by CONTENT regex (tab numbers and "cao DD MMM YY"
#      dates in filenames are ignored by design).
#   3. Verifies the URL resolved from the live page matches the pinned URL.
#   4. HEADs the resolved URL and compares Last-Modified.
#   5. On any suspected drift (URL rotated OR Last-Modified changed), downloads
#      the new PDF to docs/upstream-snapshots/<key>.pdf and HALTS.
#
# What it deliberately does NOT do:
#   - It never auto-updates docs/UPSTREAM-PINS.json in check mode. A human (or
#     Claude in a later session) must look at the saved PDF, figure out what
#     changed, update docs/DAFMAN-COMPLIANCE-MATRIX.md, then run --refresh to
#     accept the new values. This exists precisely because we do NOT know
#     what changed and silent acceptance would defeat the purpose.
#
# Exit codes:
#   0  - all sources match pins
#   1  - drift detected; new PDF(s) saved under docs/upstream-snapshots/, halt
#   2  - upstream unreachable or page blocked
#   3  - config / dependency error
#
# Modes:
#   (default)   Strict check. Downloads drifted content for review, then halts.
#   --refresh   Accept current live values. Re-downloads all sources, rewrites
#               docs/UPSTREAM-PINS.json, updates docs/upstream-snapshots/. Use
#               ONLY when intentionally accepting a new upstream publication
#               AFTER reviewing the snapshot and updating the compliance matrix.
#   --report    Human-readable summary. Never exits non-zero.

set -u
set -o pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIN_FILE="$REPO_ROOT/docs/UPSTREAM-PINS.json"
SNAP_DIR="$REPO_ROOT/docs/upstream-snapshots"
MODE="${1:-check}"
mkdir -p "$SNAP_DIR"

# Browser header set that gets past the AFPC Akamai edge WAF.
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
HDRS=(
  -H "User-Agent: $UA"
  -H 'sec-ch-ua: "Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"'
  -H 'sec-ch-ua-mobile: ?0'
  -H 'sec-ch-ua-platform: "Windows"'
  -H 'Accept-Language: en-US,en;q=0.9'
  -H 'DNT: 1'
  -H 'Upgrade-Insecure-Requests: 1'
)
HTML_HDRS=("${HDRS[@]}" -H 'Accept: text/html,application/xhtml+xml,*/*;q=0.8')
PDF_HDRS=("${HDRS[@]}" -H 'Accept: application/pdf,*/*')

command -v jq >/dev/null || { echo "ERROR: jq required" >&2; exit 3; }
command -v curl >/dev/null || { echo "ERROR: curl required" >&2; exit 3; }
command -v sha256sum >/dev/null || { echo "ERROR: sha256sum required" >&2; exit 3; }
[ -f "$PIN_FILE" ] || { echo "ERROR: missing $PIN_FILE" >&2; exit 3; }

PARENT_URL="$(jq -r '.parent_page' "$PIN_FILE")"

log()  { echo "[check-upstream] $*" >&2; }
ok()   { echo "[check-upstream] OK   $*" >&2; }
warn() { echo "[check-upstream] WARN $*" >&2; }
err()  { echo "[check-upstream] FAIL $*" >&2; }

# URL-encode spaces (and only spaces; everything else is already safe from the page).
urlenc() { echo "$1" | sed 's/ /%20/g'; }

# Absolute-ify a scraped href: turn /Portals/... into https://www.afpc.af.mil/Portals/...
abs_url() {
  local href="$1"
  case "$href" in
    http*) echo "$href" ;;
    /*)    echo "https://www.afpc.af.mil${href}" ;;
    *)     echo "$href" ;;
  esac
}

# --- Fetch parent page -----------------------------------------------------
PAGE_FILE="$(mktemp)"
trap 'rm -f "$PAGE_FILE"' EXIT
HTTP_CODE="$(curl -sSL "${HTML_HDRS[@]}" -o "$PAGE_FILE" -w '%{http_code}' "$PARENT_URL" || true)"
if [ "$HTTP_CODE" != "200" ]; then
  err "parent page fetch failed: HTTP $HTTP_CODE from $PARENT_URL"
  [ "$MODE" = "--report" ] && exit 0 || exit 2
fi
log "parent page fetched ($(wc -c <"$PAGE_FILE") bytes)"

# --- Per-source check ------------------------------------------------------
FAIL=0
DRIFTED_KEYS=()
# Refresh mode collects live values into this JSON; check mode never writes it.
REFRESH_JSON="$(jq '.' "$PIN_FILE")"

for key in $(jq -r '.sources | keys[]' "$PIN_FILE"); do
  name="$(jq -r ".sources.\"$key\".name" "$PIN_FILE")"
  match_re="$(jq -r ".sources.\"$key\".match_regex" "$PIN_FILE")"
  exclude_re="$(jq -r ".sources.\"$key\".exclude_regex // empty" "$PIN_FILE")"
  expect_count="$(jq -r ".sources.\"$key\".expect_count" "$PIN_FILE")"
  pinned_url="$(jq -r ".sources.\"$key\".pinned_url" "$PIN_FILE")"
  pinned_lm="$(jq -r ".sources.\"$key\".pinned_last_modified" "$PIN_FILE")"
  pinned_sha="$(jq -r ".sources.\"$key\".pinned_sha256" "$PIN_FILE")"

  log "--- $name ($key) ---"

  mapfile -t candidates < <(
    grep -oE 'href="[^"]+"' "$PAGE_FILE" \
      | sed -E 's/^href="//; s/"$//' \
      | grep -E "$match_re" \
      | { if [ -n "$exclude_re" ]; then grep -Ev "$exclude_re"; else cat; fi; } \
      | sort -u
  )
  count="${#candidates[@]}"
  if [ "$count" -ne "$expect_count" ]; then
    err "expected $expect_count match(es), found $count for regex '$match_re'"
    for c in "${candidates[@]}"; do err "  candidate: $c"; done
    err "parent page likely restructured. Saving page HTML to $SNAP_DIR/${key}-parent.html for inspection."
    cp "$PAGE_FILE" "$SNAP_DIR/${key}-parent.html"
    FAIL=1
    DRIFTED_KEYS+=("$key")
    continue
  fi

  resolved_url="$(abs_url "${candidates[0]}")"
  url_changed=0
  if [ "$resolved_url" != "$pinned_url" ]; then
    url_changed=1
    err "URL rotated:"
    err "  pinned:   $pinned_url"
    err "  resolved: $resolved_url"
  fi

  fetch_url="$(urlenc "$resolved_url")"
  HDR_FILE="$(mktemp)"
  HTTP_CODE="$(curl -sSI "${PDF_HDRS[@]}" -o "$HDR_FILE" -w '%{http_code}' "$fetch_url" || true)"
  if [ "$HTTP_CODE" != "200" ]; then
    err "HEAD $fetch_url returned HTTP $HTTP_CODE"
    rm -f "$HDR_FILE"
    FAIL=1
    DRIFTED_KEYS+=("$key")
    continue
  fi
  live_lm="$(grep -i '^last-modified:' "$HDR_FILE" | sed -E 's/^[Ll]ast-[Mm]odified:[[:space:]]*//; s/\r$//' | head -1)"
  live_cl="$(grep -i '^content-length:' "$HDR_FILE" | sed -E 's/^[Cc]ontent-[Ll]ength:[[:space:]]*//; s/\r$//' | head -1)"
  rm -f "$HDR_FILE"

  lm_changed=0
  if [ "$live_lm" != "$pinned_lm" ]; then
    lm_changed=1
    err "Last-Modified changed:"
    err "  pinned: $pinned_lm"
    err "  live:   $live_lm"
  fi

  # Download the body when drift is suspected OR in refresh mode. On drift,
  # the body is saved to the snapshots dir so a human can review it.
  need_body=0
  if [ "$MODE" = "--refresh" ] || [ "$lm_changed" = "1" ] || [ "$url_changed" = "1" ]; then
    need_body=1
  fi

  snap_path="$SNAP_DIR/${key}.pdf"
  if [ "$need_body" = "1" ]; then
    HTTP_CODE="$(curl -sSL "${PDF_HDRS[@]}" -o "$snap_path" -w '%{http_code}' "$fetch_url" || true)"
    if [ "$HTTP_CODE" != "200" ]; then
      err "GET $fetch_url returned HTTP $HTTP_CODE"
      rm -f "$snap_path"
      FAIL=1
      DRIFTED_KEYS+=("$key")
      continue
    fi
    live_sha="$(sha256sum "$snap_path" | cut -d' ' -f1)"
    live_size="$(wc -c <"$snap_path")"

    sha_changed=0
    if [ "$live_sha" != "$pinned_sha" ]; then
      sha_changed=1
      err "sha256 changed:"
      err "  pinned: $pinned_sha"
      err "  live:   $live_sha"
    fi

    if [ "$MODE" = "--refresh" ]; then
      REFRESH_JSON="$(jq --arg k "$key" --arg v "$resolved_url" '.sources[$k].pinned_url = $v' <<<"$REFRESH_JSON")"
      REFRESH_JSON="$(jq --arg k "$key" --arg v "$live_lm"     '.sources[$k].pinned_last_modified = $v' <<<"$REFRESH_JSON")"
      REFRESH_JSON="$(jq --arg k "$key" --arg v "$live_sha"    '.sources[$k].pinned_sha256 = $v' <<<"$REFRESH_JSON")"
      REFRESH_JSON="$(jq --arg k "$key" --argjson v "$live_size" '.sources[$k].pinned_content_length = $v' <<<"$REFRESH_JSON")"
      ok "snapshot refreshed: $snap_path ($live_size bytes, sha $live_sha)"
    elif [ "$url_changed" = "1" ] || [ "$lm_changed" = "1" ] || [ "$sha_changed" = "1" ]; then
      err "new content saved to $snap_path for review ($live_size bytes)"
      FAIL=1
      DRIFTED_KEYS+=("$key")
    else
      ok "body unchanged (sha256 matches)"
    fi
  else
    # No drift suspected. Don't touch the snapshot file.
    if [ -n "$live_cl" ] && [ "$live_cl" != "$(jq -r ".sources.\"$key\".pinned_content_length" "$PIN_FILE")" ]; then
      warn "content-length drift ($live_cl vs pinned) but Last-Modified unchanged -- CDN cache oddity, not failing"
    fi
    ok "Last-Modified + URL match pin"
  fi
done

# --- Refresh mode: rewrite pin file ----------------------------------------
if [ "$MODE" = "--refresh" ]; then
  echo "$REFRESH_JSON" | jq '.' >"$PIN_FILE"
  log "refreshed $PIN_FILE and snapshots in $SNAP_DIR/"
  log "commit both together with docs/DAFMAN-COMPLIANCE-MATRIX.md updates."
  exit 0
fi

if [ "$MODE" = "--report" ]; then
  exit 0
fi

if [ "$FAIL" -ne 0 ]; then
  err ""
  err "DRIFT DETECTED. Deploy blocked. Sources drifted: ${DRIFTED_KEYS[*]}"
  err "New content saved under: $SNAP_DIR/"
  err ""
  err "Human/Claude workflow:"
  err "  1. Open docs/upstream-snapshots/<key>.pdf and review what changed."
  err "  2. Update docs/DAFMAN-COMPLIANCE-MATRIX.md with cited changes."
  err "  3. Update src/utils/scoring/* tables/constants as needed."
  err "  4. Run: bash scripts/check-upstream-pubs.sh --refresh"
  err "  5. Commit snapshots + pin file + matrix + scoring updates together."
  exit 1
fi

log "all pins match. No drift."
exit 0
