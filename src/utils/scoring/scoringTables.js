/**
 * Scoring tables for 2026 PFA (50-20-15-15 model)
 * Source: Final USAF Physical Fitness Readiness Assessment Scoring (Effective 1 Mar 26)
 * All 18 age/gender brackets (9 age brackets x 2 genders)
 *
 * GENERATED FILE - DO NOT EDIT BY HAND.
 * Source of truth: docs/PFRA-Scoring-Charts.md
 * Regenerate: node scripts/generate-scoring-tables.mjs
 * Verify: node scripts/validate-scoring-tables.mjs
 */

import { EXERCISES, GENDER, AGE_BRACKETS } from './constants.js'

/**
 * Scoring table structure:
 * {
 *   [gender]: {
 *     [ageGroup]: {
 *       [exercise]: [
 *         { threshold, points },
 *         ...
 *       ]
 *     }
 *   }
 * }
 *
 * For times (run): threshold = max time in seconds for that point value
 *   Table sorted ascending (fastest time first = max points)
 * For reps/shuttles: threshold = minimum reps/shuttles for that point value
 *   Table sorted descending (highest reps first = max points)
 * For plank: threshold = minimum hold time in seconds
 *   Table sorted descending (longest hold first = max points)
 * For WHtR: threshold = max ratio for that point value
 *   Table sorted ascending (lowest ratio first = max points)
 */

export const SCORING_TABLES = {
  [GENDER.MALE]: {
    // =====================================================================
    // MALE <25
    // =====================================================================
    [AGE_BRACKETS.UNDER_25]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 805, points: 50.0 },  // 13:25
        { threshold: 824, points: 49.5 },  // 13:44
        { threshold: 843, points: 49.0 },  // 14:03
        { threshold: 862, points: 48.0 },  // 14:22
        { threshold: 881, points: 47.0 },  // 14:41
        { threshold: 900, points: 46.0 },  // 15:00
        { threshold: 919, points: 45.0 },  // 15:19
        { threshold: 938, points: 44.0 },  // 15:38
        { threshold: 957, points: 43.0 },  // 15:57
        { threshold: 976, points: 42.0 },  // 16:16
        { threshold: 995, points: 41.0 },  // 16:35
        { threshold: 1014, points: 40.0 },  // 16:54
        { threshold: 1033, points: 39.0 },  // 17:13
        { threshold: 1052, points: 38.5 },  // 17:32
        { threshold: 1071, points: 38.0 },  // 17:51
        { threshold: 1090, points: 37.5 },  // 18:10
        { threshold: 1109, points: 37.0 },  // 18:29
        { threshold: 1128, points: 36.5 },  // 18:48
        { threshold: 1147, points: 36.0 },  // 19:07
        { threshold: 1176, points: 35.5 },  // 19:36
        { threshold: 1185, points: 35.0 },  // 19:45
      ],
      [EXERCISES.HAMR]: [
        { threshold: 87, points: 50.0 },
        { threshold: 84, points: 49.5 },
        { threshold: 81, points: 49.0 },
        { threshold: 78, points: 48.0 },
        { threshold: 75, points: 47.0 },
        { threshold: 72, points: 46.0 },
        { threshold: 70, points: 45.0 },
        { threshold: 67, points: 44.0 },
        { threshold: 65, points: 43.0 },
        { threshold: 63, points: 42.0 },
        { threshold: 60, points: 41.0 },
        { threshold: 58, points: 40.0 },
        { threshold: 56, points: 39.0 },
        { threshold: 54, points: 38.5 },
        { threshold: 52, points: 38.0 },
        { threshold: 51, points: 37.5 },
        { threshold: 49, points: 37.0 },
        { threshold: 47, points: 36.5 },
        { threshold: 46, points: 36.0 },
        { threshold: 44, points: 35.5 },
        { threshold: 42, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 67, points: 15.0 },
        { threshold: 66, points: 14.5 },
        { threshold: 64, points: 14.0 },
        { threshold: 63, points: 13.5 },
        { threshold: 61, points: 13.0 },
        { threshold: 60, points: 12.5 },
        { threshold: 58, points: 12.0 },
        { threshold: 57, points: 11.5 },
        { threshold: 55, points: 11.0 },
        { threshold: 54, points: 10.5 },
        { threshold: 52, points: 10.0 },
        { threshold: 51, points: 9.5 },
        { threshold: 49, points: 9.0 },
        { threshold: 48, points: 8.5 },
        { threshold: 46, points: 8.0 },
        { threshold: 45, points: 7.5 },
        { threshold: 43, points: 7.0 },
        { threshold: 42, points: 6.5 },
        { threshold: 40, points: 6.0 },
        { threshold: 39, points: 5.5 },
        { threshold: 37, points: 5.0 },
        { threshold: 36, points: 4.5 },
        { threshold: 34, points: 4.0 },
        { threshold: 33, points: 3.5 },
        { threshold: 31, points: 3.0 },
        { threshold: 30, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 52, points: 15.0 },
        { threshold: 51, points: 14.5 },
        { threshold: 50, points: 14.0 },
        { threshold: 49, points: 13.5 },
        { threshold: 48, points: 13.0 },
        { threshold: 47, points: 12.5 },
        { threshold: 46, points: 12.0 },
        { threshold: 45, points: 11.5 },
        { threshold: 44, points: 11.0 },
        { threshold: 43, points: 10.5 },
        { threshold: 42, points: 10.0 },
        { threshold: 41, points: 9.5 },
        { threshold: 40, points: 9.0 },
        { threshold: 39, points: 8.5 },
        { threshold: 38, points: 8.0 },
        { threshold: 37, points: 7.5 },
        { threshold: 36, points: 7.0 },
        { threshold: 35, points: 6.5 },
        { threshold: 34, points: 6.0 },
        { threshold: 33, points: 5.5 },
        { threshold: 32, points: 5.0 },
        { threshold: 31, points: 4.5 },
        { threshold: 30, points: 4.0 },
        { threshold: 29, points: 3.5 },
        { threshold: 28, points: 3.0 },
        { threshold: 27, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 58, points: 15.0 },
        { threshold: 57, points: 14.5 },
        { threshold: 56, points: 14.0 },
        { threshold: 55, points: 13.5 },
        { threshold: 54, points: 13.0 },
        { threshold: 53, points: 12.5 },
        { threshold: 52, points: 12.0 },
        { threshold: 51, points: 11.5 },
        { threshold: 50, points: 11.0 },
        { threshold: 49, points: 10.5 },
        { threshold: 48, points: 10.0 },
        { threshold: 47, points: 9.5 },
        { threshold: 46, points: 9.0 },
        { threshold: 45, points: 8.5 },
        { threshold: 44, points: 8.0 },
        { threshold: 43, points: 7.5 },
        { threshold: 42, points: 7.0 },
        { threshold: 41, points: 6.5 },
        { threshold: 40, points: 6.0 },
        { threshold: 39, points: 5.5 },
        { threshold: 38, points: 5.0 },
        { threshold: 37, points: 4.5 },
        { threshold: 36, points: 4.0 },
        { threshold: 35, points: 3.5 },
        { threshold: 34, points: 3.0 },
        { threshold: 33, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 60, points: 15.0 },
        { threshold: 59, points: 14.5 },
        { threshold: 58, points: 14.0 },
        { threshold: 57, points: 13.5 },
        { threshold: 56, points: 13.0 },
        { threshold: 55, points: 12.5 },
        { threshold: 54, points: 12.0 },
        { threshold: 53, points: 11.5 },
        { threshold: 52, points: 11.0 },
        { threshold: 51, points: 10.5 },
        { threshold: 50, points: 10.0 },
        { threshold: 49, points: 9.5 },
        { threshold: 48, points: 9.0 },
        { threshold: 47, points: 8.5 },
        { threshold: 46, points: 8.0 },
        { threshold: 45, points: 7.5 },
        { threshold: 44, points: 7.0 },
        { threshold: 43, points: 6.5 },
        { threshold: 42, points: 6.0 },
        { threshold: 41, points: 5.5 },
        { threshold: 40, points: 5.0 },
        { threshold: 39, points: 4.5 },
        { threshold: 38, points: 4.0 },
        { threshold: 37, points: 3.5 },
        { threshold: 36, points: 3.0 },
        { threshold: 35, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 220, points: 15.0 },  // 3:40
        { threshold: 215, points: 14.5 },  // 3:35
        { threshold: 210, points: 14.0 },  // 3:30
        { threshold: 205, points: 13.5 },  // 3:25
        { threshold: 200, points: 13.0 },  // 3:20
        { threshold: 195, points: 12.5 },  // 3:15
        { threshold: 190, points: 12.0 },  // 3:10
        { threshold: 185, points: 11.5 },  // 3:05
        { threshold: 180, points: 11.0 },  // 3:00
        { threshold: 175, points: 10.5 },  // 2:55
        { threshold: 170, points: 10.0 },  // 2:50
        { threshold: 165, points: 9.5 },  // 2:45
        { threshold: 160, points: 9.0 },  // 2:40
        { threshold: 155, points: 8.5 },  // 2:35
        { threshold: 150, points: 8.0 },  // 2:30
        { threshold: 145, points: 7.5 },  // 2:25
        { threshold: 140, points: 7.0 },  // 2:20
        { threshold: 135, points: 6.5 },  // 2:15
        { threshold: 130, points: 6.0 },  // 2:10
        { threshold: 125, points: 5.5 },  // 2:05
        { threshold: 120, points: 5.0 },  // 2:00
        { threshold: 115, points: 4.5 },  // 1:55
        { threshold: 110, points: 4.0 },  // 1:50
        { threshold: 105, points: 3.5 },  // 1:45
        { threshold: 100, points: 3.0 },  // 1:40
        { threshold: 95, points: 2.5 },  // 1:35
      ],
    },
    // =====================================================================
    // MALE 25-29
    // =====================================================================
    [AGE_BRACKETS.AGE_25_29]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 815, points: 50.0 },  // 13:35
        { threshold: 834, points: 49.5 },  // 13:54
        { threshold: 853, points: 49.0 },  // 14:13
        { threshold: 872, points: 48.0 },  // 14:32
        { threshold: 891, points: 47.0 },  // 14:51
        { threshold: 910, points: 46.0 },  // 15:10
        { threshold: 929, points: 45.0 },  // 15:29
        { threshold: 948, points: 44.0 },  // 15:48
        { threshold: 967, points: 43.0 },  // 16:07
        { threshold: 986, points: 42.0 },  // 16:26
        { threshold: 1005, points: 41.0 },  // 16:45
        { threshold: 1024, points: 40.0 },  // 17:04
        { threshold: 1043, points: 39.0 },  // 17:23
        { threshold: 1062, points: 38.5 },  // 17:42
        { threshold: 1081, points: 38.0 },  // 18:01
        { threshold: 1100, points: 37.5 },  // 18:20
        { threshold: 1119, points: 37.0 },  // 18:39
        { threshold: 1138, points: 36.5 },  // 18:58
        { threshold: 1157, points: 36.0 },  // 19:17
        { threshold: 1176, points: 35.5 },  // 19:36
        { threshold: 1195, points: 35.0 },  // 19:55
      ],
      [EXERCISES.HAMR]: [
        { threshold: 85, points: 50.0 },
        { threshold: 82, points: 49.5 },
        { threshold: 79, points: 49.0 },
        { threshold: 76, points: 48.0 },
        { threshold: 74, points: 47.0 },
        { threshold: 71, points: 46.0 },
        { threshold: 69, points: 45.0 },
        { threshold: 66, points: 44.0 },
        { threshold: 64, points: 43.0 },
        { threshold: 62, points: 42.0 },
        { threshold: 59, points: 41.0 },
        { threshold: 57, points: 40.0 },
        { threshold: 55, points: 39.0 },
        { threshold: 53, points: 38.5 },
        { threshold: 52, points: 38.0 },
        { threshold: 50, points: 37.5 },
        { threshold: 48, points: 37.0 },
        { threshold: 46, points: 36.5 },
        { threshold: 45, points: 36.0 },
        { threshold: 43, points: 35.5 },
        { threshold: 42, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 63, points: 15.0 },
        { threshold: 62, points: 14.5 },
        { threshold: 60, points: 14.0 },
        { threshold: 59, points: 13.5 },
        { threshold: 57, points: 13.0 },
        { threshold: 56, points: 12.5 },
        { threshold: 55, points: 12.0 },
        { threshold: 53, points: 11.5 },
        { threshold: 52, points: 11.0 },
        { threshold: 50, points: 10.5 },
        { threshold: 49, points: 10.0 },
        { threshold: 48, points: 9.5 },
        { threshold: 46, points: 9.0 },
        { threshold: 45, points: 8.5 },
        { threshold: 43, points: 8.0 },
        { threshold: 42, points: 7.5 },
        { threshold: 41, points: 7.0 },
        { threshold: 39, points: 6.5 },
        { threshold: 38, points: 6.0 },
        { threshold: 36, points: 5.5 },
        { threshold: 35, points: 5.0 },
        { threshold: 34, points: 4.5 },
        { threshold: 32, points: 4.0 },
        { threshold: 31, points: 3.5 },
        { threshold: 29, points: 3.0 },
        { threshold: 28, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 50, points: 15.0 },
        { threshold: 49, points: 14.5 },
        { threshold: 48, points: 14.0 },
        { threshold: 47, points: 13.5 },
        { threshold: 46, points: 13.0 },
        { threshold: 45, points: 12.5 },
        { threshold: 44, points: 12.0 },
        { threshold: 43, points: 11.5 },
        { threshold: 42, points: 11.0 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 10.0 },
        { threshold: 39, points: 9.5 },
        { threshold: 38, points: 9.0 },
        { threshold: 37, points: 8.5 },
        { threshold: 36, points: 8.0 },
        { threshold: 35, points: 7.5 },
        { threshold: 34, points: 7.0 },
        { threshold: 33, points: 6.5 },
        { threshold: 32, points: 6.0 },
        { threshold: 31, points: 5.5 },
        { threshold: 30, points: 5.0 },
        { threshold: 29, points: 4.5 },
        { threshold: 28, points: 4.0 },
        { threshold: 27, points: 3.5 },
        { threshold: 26, points: 3.0 },
        { threshold: 25, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 56, points: 15.0 },
        { threshold: 55, points: 14.5 },
        { threshold: 54, points: 14.0 },
        { threshold: 53, points: 13.5 },
        { threshold: 52, points: 13.0 },
        { threshold: 51, points: 12.5 },
        { threshold: 50, points: 12.0 },
        { threshold: 49, points: 11.5 },
        { threshold: 48, points: 11.0 },
        { threshold: 47, points: 10.5 },
        { threshold: 46, points: 10.0 },
        { threshold: 45, points: 9.5 },
        { threshold: 44, points: 9.0 },
        { threshold: 43, points: 8.5 },
        { threshold: 42, points: 8.0 },
        { threshold: 41, points: 7.5 },
        { threshold: 40, points: 7.0 },
        { threshold: 39, points: 6.5 },
        { threshold: 38, points: 6.0 },
        { threshold: 37, points: 5.5 },
        { threshold: 36, points: 5.0 },
        { threshold: 35, points: 4.5 },
        { threshold: 34, points: 4.0 },
        { threshold: 33, points: 3.5 },
        { threshold: 32, points: 3.0 },
        { threshold: 31, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 58, points: 15.0 },
        { threshold: 57, points: 14.5 },
        { threshold: 56, points: 14.0 },
        { threshold: 55, points: 13.5 },
        { threshold: 54, points: 13.0 },
        { threshold: 53, points: 12.5 },
        { threshold: 52, points: 12.0 },
        { threshold: 51, points: 11.5 },
        { threshold: 50, points: 11.0 },
        { threshold: 49, points: 10.5 },
        { threshold: 48, points: 10.0 },
        { threshold: 47, points: 9.5 },
        { threshold: 46, points: 9.0 },
        { threshold: 45, points: 8.5 },
        { threshold: 44, points: 8.0 },
        { threshold: 43, points: 7.5 },
        { threshold: 42, points: 7.0 },
        { threshold: 41, points: 6.5 },
        { threshold: 40, points: 6.0 },
        { threshold: 39, points: 5.5 },
        { threshold: 38, points: 5.0 },
        { threshold: 37, points: 4.5 },
        { threshold: 36, points: 4.0 },
        { threshold: 35, points: 3.5 },
        { threshold: 34, points: 3.0 },
        { threshold: 33, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 215, points: 15.0 },  // 3:35
        { threshold: 210, points: 14.5 },  // 3:30
        { threshold: 205, points: 14.0 },  // 3:25
        { threshold: 200, points: 13.5 },  // 3:20
        { threshold: 195, points: 13.0 },  // 3:15
        { threshold: 190, points: 12.5 },  // 3:10
        { threshold: 185, points: 12.0 },  // 3:05
        { threshold: 180, points: 11.5 },  // 3:00
        { threshold: 175, points: 11.0 },  // 2:55
        { threshold: 170, points: 10.5 },  // 2:50
        { threshold: 165, points: 10.0 },  // 2:45
        { threshold: 160, points: 9.5 },  // 2:40
        { threshold: 155, points: 9.0 },  // 2:35
        { threshold: 150, points: 8.5 },  // 2:30
        { threshold: 145, points: 8.0 },  // 2:25
        { threshold: 140, points: 7.5 },  // 2:20
        { threshold: 135, points: 7.0 },  // 2:15
        { threshold: 130, points: 6.5 },  // 2:10
        { threshold: 125, points: 6.0 },  // 2:05
        { threshold: 120, points: 5.5 },  // 2:00
        { threshold: 115, points: 5.0 },  // 1:55
        { threshold: 110, points: 4.5 },  // 1:50
        { threshold: 105, points: 4.0 },  // 1:45
        { threshold: 100, points: 3.5 },  // 1:40
        { threshold: 95, points: 3.0 },  // 1:35
        { threshold: 90, points: 2.5 },  // 1:30
      ],
    },
    // =====================================================================
    // MALE 30-34
    // =====================================================================
    [AGE_BRACKETS.AGE_30_34]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 822, points: 50.0 },  // 13:42
        { threshold: 843, points: 49.5 },  // 14:03
        { threshold: 864, points: 49.0 },  // 14:24
        { threshold: 885, points: 48.0 },  // 14:45
        { threshold: 906, points: 47.0 },  // 15:06
        { threshold: 928, points: 46.0 },  // 15:28
        { threshold: 949, points: 45.0 },  // 15:49
        { threshold: 970, points: 44.0 },  // 16:10
        { threshold: 991, points: 43.0 },  // 16:31
        { threshold: 1012, points: 42.0 },  // 16:52
        { threshold: 1033, points: 41.0 },  // 17:13
        { threshold: 1054, points: 40.0 },  // 17:34
        { threshold: 1075, points: 39.0 },  // 17:55
        { threshold: 1096, points: 38.5 },  // 18:16
        { threshold: 1117, points: 38.0 },  // 18:37
        { threshold: 1139, points: 37.5 },  // 18:59
        { threshold: 1160, points: 37.0 },  // 19:20
        { threshold: 1181, points: 36.5 },  // 19:41
        { threshold: 1202, points: 36.0 },  // 20:02
        { threshold: 1223, points: 35.5 },  // 20:23
        { threshold: 1244, points: 35.0 },  // 20:44
      ],
      [EXERCISES.HAMR]: [
        { threshold: 84, points: 50.0 },
        { threshold: 81, points: 49.5 },
        { threshold: 78, points: 49.0 },
        { threshold: 75, points: 48.0 },
        { threshold: 72, points: 47.0 },
        { threshold: 69, points: 46.0 },
        { threshold: 66, points: 45.0 },
        { threshold: 63, points: 44.0 },
        { threshold: 61, points: 43.0 },
        { threshold: 59, points: 42.0 },
        { threshold: 56, points: 41.0 },
        { threshold: 54, points: 40.0 },
        { threshold: 52, points: 39.0 },
        { threshold: 50, points: 38.5 },
        { threshold: 48, points: 38.0 },
        { threshold: 46, points: 37.5 },
        { threshold: 44, points: 37.0 },
        { threshold: 43, points: 36.5 },
        { threshold: 41, points: 36.0 },
        { threshold: 39, points: 35.5 },
        { threshold: 38, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 60, points: 15.0 },
        { threshold: 59, points: 14.5 },
        { threshold: 57, points: 14.0 },
        { threshold: 56, points: 13.5 },
        { threshold: 55, points: 13.0 },
        { threshold: 53, points: 12.5 },
        { threshold: 52, points: 12.0 },
        { threshold: 51, points: 11.5 },
        { threshold: 49, points: 11.0 },
        { threshold: 48, points: 10.5 },
        { threshold: 47, points: 10.0 },
        { threshold: 45, points: 9.5 },
        { threshold: 44, points: 9.0 },
        { threshold: 43, points: 8.5 },
        { threshold: 41, points: 8.0 },
        { threshold: 40, points: 7.5 },
        { threshold: 39, points: 7.0 },
        { threshold: 37, points: 6.5 },
        { threshold: 36, points: 6.0 },
        { threshold: 35, points: 5.5 },
        { threshold: 33, points: 5.0 },
        { threshold: 32, points: 4.5 },
        { threshold: 31, points: 4.0 },
        { threshold: 29, points: 3.5 },
        { threshold: 26, points: 3.0 },
        { threshold: 26, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 48, points: 15.0 },
        { threshold: 47, points: 14.5 },
        { threshold: 46, points: 14.0 },
        { threshold: 45, points: 13.5 },
        { threshold: 44, points: 13.0 },
        { threshold: 43, points: 12.5 },
        { threshold: 42, points: 12.0 },
        { threshold: 41, points: 11.5 },
        { threshold: 40, points: 11.0 },
        { threshold: 39, points: 10.5 },
        { threshold: 38, points: 10.0 },
        { threshold: 37, points: 9.5 },
        { threshold: 36, points: 9.0 },
        { threshold: 35, points: 8.5 },
        { threshold: 34, points: 8.0 },
        { threshold: 33, points: 7.5 },
        { threshold: 32, points: 7.0 },
        { threshold: 31, points: 6.5 },
        { threshold: 30, points: 6.0 },
        { threshold: 29, points: 5.5 },
        { threshold: 28, points: 5.0 },
        { threshold: 27, points: 4.5 },
        { threshold: 26, points: 4.0 },
        { threshold: 25, points: 3.5 },
        { threshold: 24, points: 3.0 },
        { threshold: 23, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 54, points: 15.0 },
        { threshold: 53, points: 14.5 },
        { threshold: 52, points: 14.0 },
        { threshold: 51, points: 13.5 },
        { threshold: 50, points: 13.0 },
        { threshold: 49, points: 12.5 },
        { threshold: 48, points: 12.0 },
        { threshold: 47, points: 11.5 },
        { threshold: 46, points: 11.0 },
        { threshold: 45, points: 10.5 },
        { threshold: 44, points: 10.0 },
        { threshold: 43, points: 9.5 },
        { threshold: 42, points: 9.0 },
        { threshold: 41, points: 8.5 },
        { threshold: 40, points: 8.0 },
        { threshold: 39, points: 7.5 },
        { threshold: 38, points: 7.0 },
        { threshold: 37, points: 6.5 },
        { threshold: 36, points: 6.0 },
        { threshold: 35, points: 5.5 },
        { threshold: 34, points: 5.0 },
        { threshold: 33, points: 4.5 },
        { threshold: 32, points: 4.0 },
        { threshold: 31, points: 3.5 },
        { threshold: 30, points: 3.0 },
        { threshold: 29, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 56, points: 15.0 },
        { threshold: 55, points: 14.5 },
        { threshold: 54, points: 14.0 },
        { threshold: 53, points: 13.5 },
        { threshold: 52, points: 13.0 },
        { threshold: 51, points: 12.5 },
        { threshold: 50, points: 12.0 },
        { threshold: 49, points: 11.5 },
        { threshold: 48, points: 11.0 },
        { threshold: 47, points: 10.5 },
        { threshold: 46, points: 10.0 },
        { threshold: 45, points: 9.5 },
        { threshold: 44, points: 9.0 },
        { threshold: 43, points: 8.5 },
        { threshold: 42, points: 8.0 },
        { threshold: 41, points: 7.5 },
        { threshold: 40, points: 7.0 },
        { threshold: 39, points: 6.5 },
        { threshold: 38, points: 6.0 },
        { threshold: 37, points: 5.5 },
        { threshold: 36, points: 5.0 },
        { threshold: 35, points: 4.5 },
        { threshold: 34, points: 4.0 },
        { threshold: 33, points: 3.5 },
        { threshold: 32, points: 3.0 },
        { threshold: 31, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 210, points: 15.0 },  // 3:30
        { threshold: 205, points: 14.5 },  // 3:25
        { threshold: 200, points: 14.0 },  // 3:20
        { threshold: 195, points: 13.5 },  // 3:15
        { threshold: 190, points: 13.0 },  // 3:10
        { threshold: 185, points: 12.5 },  // 3:05
        { threshold: 180, points: 12.0 },  // 3:00
        { threshold: 175, points: 11.5 },  // 2:55
        { threshold: 170, points: 11.0 },  // 2:50
        { threshold: 165, points: 10.5 },  // 2:45
        { threshold: 160, points: 10.0 },  // 2:40
        { threshold: 155, points: 9.5 },  // 2:35
        { threshold: 150, points: 9.0 },  // 2:30
        { threshold: 145, points: 8.5 },  // 2:25
        { threshold: 140, points: 8.0 },  // 2:20
        { threshold: 135, points: 7.5 },  // 2:15
        { threshold: 130, points: 7.0 },  // 2:10
        { threshold: 125, points: 6.5 },  // 2:05
        { threshold: 120, points: 6.0 },  // 2:00
        { threshold: 115, points: 5.5 },  // 1:55
        { threshold: 110, points: 5.0 },  // 1:50
        { threshold: 105, points: 4.5 },  // 1:45
        { threshold: 100, points: 4.0 },  // 1:40
        { threshold: 95, points: 3.5 },  // 1:35
        { threshold: 90, points: 3.0 },  // 1:30
        { threshold: 85, points: 2.5 },  // 1:25
      ],
    },
    // =====================================================================
    // MALE 35-39
    // =====================================================================
    [AGE_BRACKETS.AGE_35_39]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 836, points: 50.0 },  // 13:56
        { threshold: 858, points: 49.5 },  // 14:18
        { threshold: 880, points: 49.0 },  // 14:40
        { threshold: 902, points: 48.0 },  // 15:02
        { threshold: 924, points: 47.0 },  // 15:24
        { threshold: 946, points: 46.0 },  // 15:46
        { threshold: 968, points: 45.0 },  // 16:08
        { threshold: 990, points: 44.0 },  // 16:30
        { threshold: 1012, points: 43.0 },  // 16:52
        { threshold: 1034, points: 42.0 },  // 17:14
        { threshold: 1056, points: 41.0 },  // 17:36
        { threshold: 1078, points: 40.0 },  // 17:58
        { threshold: 1100, points: 39.0 },  // 18:20
        { threshold: 1122, points: 38.5 },  // 18:42
        { threshold: 1144, points: 38.0 },  // 19:04
        { threshold: 1166, points: 37.5 },  // 19:26
        { threshold: 1188, points: 37.0 },  // 19:48
        { threshold: 1210, points: 36.5 },  // 20:10
        { threshold: 1232, points: 36.0 },  // 20:32
        { threshold: 1254, points: 35.5 },  // 20:54
        { threshold: 1276, points: 35.0 },  // 21:16
      ],
      [EXERCISES.HAMR]: [
        { threshold: 82, points: 50.0 },
        { threshold: 79, points: 49.5 },
        { threshold: 75, points: 49.0 },
        { threshold: 72, points: 48.0 },
        { threshold: 69, points: 47.0 },
        { threshold: 66, points: 46.0 },
        { threshold: 64, points: 45.0 },
        { threshold: 61, points: 44.0 },
        { threshold: 59, points: 43.0 },
        { threshold: 56, points: 42.0 },
        { threshold: 54, points: 41.0 },
        { threshold: 52, points: 40.0 },
        { threshold: 50, points: 39.0 },
        { threshold: 48, points: 38.5 },
        { threshold: 46, points: 38.0 },
        { threshold: 44, points: 37.5 },
        { threshold: 42, points: 37.0 },
        { threshold: 40, points: 36.5 },
        { threshold: 39, points: 36.0 },
        { threshold: 37, points: 35.5 },
        { threshold: 36, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 56, points: 15.0 },
        { threshold: 55, points: 14.5 },
        { threshold: 53, points: 14.0 },
        { threshold: 52, points: 13.5 },
        { threshold: 51, points: 13.0 },
        { threshold: 49, points: 12.5 },
        { threshold: 48, points: 12.0 },
        { threshold: 47, points: 11.5 },
        { threshold: 45, points: 11.0 },
        { threshold: 44, points: 10.5 },
        { threshold: 43, points: 10.0 },
        { threshold: 41, points: 9.5 },
        { threshold: 40, points: 9.0 },
        { threshold: 39, points: 8.5 },
        { threshold: 38, points: 8.0 },
        { threshold: 36, points: 7.5 },
        { threshold: 35, points: 7.0 },
        { threshold: 34, points: 6.5 },
        { threshold: 32, points: 6.0 },
        { threshold: 31, points: 5.5 },
        { threshold: 30, points: 5.0 },
        { threshold: 28, points: 4.5 },
        { threshold: 27, points: 4.0 },
        { threshold: 26, points: 3.5 },
        { threshold: 24, points: 3.0 },
        { threshold: 23, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 46, points: 15.0 },
        { threshold: 45, points: 14.5 },
        { threshold: 44, points: 14.0 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.0 },
        { threshold: 41, points: 12.5 },
        { threshold: 40, points: 12.0 },
        { threshold: 39, points: 11.5 },
        { threshold: 38, points: 11.0 },
        { threshold: 37, points: 10.5 },
        { threshold: 36, points: 10.0 },
        { threshold: 35, points: 9.5 },
        { threshold: 34, points: 9.0 },
        { threshold: 33, points: 8.5 },
        { threshold: 32, points: 8.0 },
        { threshold: 31, points: 7.5 },
        { threshold: 30, points: 7.0 },
        { threshold: 29, points: 6.5 },
        { threshold: 28, points: 6.0 },
        { threshold: 27, points: 5.5 },
        { threshold: 26, points: 5.0 },
        { threshold: 25, points: 4.5 },
        { threshold: 24, points: 4.0 },
        { threshold: 23, points: 3.5 },
        { threshold: 22, points: 3.0 },
        { threshold: 21, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 52, points: 15.0 },
        { threshold: 51, points: 14.5 },
        { threshold: 50, points: 14.0 },
        { threshold: 49, points: 13.5 },
        { threshold: 48, points: 13.0 },
        { threshold: 47, points: 12.5 },
        { threshold: 46, points: 12.0 },
        { threshold: 45, points: 11.5 },
        { threshold: 44, points: 11.0 },
        { threshold: 43, points: 10.5 },
        { threshold: 42, points: 10.0 },
        { threshold: 41, points: 9.5 },
        { threshold: 40, points: 9.0 },
        { threshold: 39, points: 8.5 },
        { threshold: 38, points: 8.0 },
        { threshold: 37, points: 7.5 },
        { threshold: 36, points: 7.0 },
        { threshold: 35, points: 6.5 },
        { threshold: 34, points: 6.0 },
        { threshold: 33, points: 5.5 },
        { threshold: 32, points: 5.0 },
        { threshold: 31, points: 4.5 },
        { threshold: 30, points: 4.0 },
        { threshold: 29, points: 3.5 },
        { threshold: 28, points: 3.0 },
        { threshold: 27, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 54, points: 15.0 },
        { threshold: 53, points: 14.5 },
        { threshold: 52, points: 14.0 },
        { threshold: 51, points: 13.5 },
        { threshold: 50, points: 13.0 },
        { threshold: 49, points: 12.5 },
        { threshold: 48, points: 12.0 },
        { threshold: 47, points: 11.5 },
        { threshold: 46, points: 11.0 },
        { threshold: 45, points: 10.5 },
        { threshold: 44, points: 10.0 },
        { threshold: 43, points: 9.5 },
        { threshold: 42, points: 9.0 },
        { threshold: 41, points: 8.5 },
        { threshold: 40, points: 8.0 },
        { threshold: 39, points: 7.5 },
        { threshold: 38, points: 7.0 },
        { threshold: 37, points: 6.5 },
        { threshold: 36, points: 6.0 },
        { threshold: 35, points: 5.5 },
        { threshold: 34, points: 5.0 },
        { threshold: 33, points: 4.5 },
        { threshold: 32, points: 4.0 },
        { threshold: 31, points: 3.5 },
        { threshold: 30, points: 3.0 },
        { threshold: 29, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 205, points: 15.0 },  // 3:25
        { threshold: 200, points: 14.5 },  // 3:20
        { threshold: 195, points: 14.0 },  // 3:15
        { threshold: 190, points: 13.5 },  // 3:10
        { threshold: 185, points: 13.0 },  // 3:05
        { threshold: 180, points: 12.5 },  // 3:00
        { threshold: 175, points: 12.0 },  // 2:55
        { threshold: 170, points: 11.5 },  // 2:50
        { threshold: 165, points: 11.0 },  // 2:45
        { threshold: 160, points: 10.5 },  // 2:40
        { threshold: 155, points: 10.0 },  // 2:35
        { threshold: 150, points: 9.5 },  // 2:30
        { threshold: 145, points: 9.0 },  // 2:25
        { threshold: 140, points: 8.5 },  // 2:20
        { threshold: 135, points: 8.0 },  // 2:15
        { threshold: 130, points: 7.5 },  // 2:10
        { threshold: 125, points: 7.0 },  // 2:05
        { threshold: 120, points: 6.5 },  // 2:00
        { threshold: 115, points: 6.0 },  // 1:55
        { threshold: 110, points: 5.5 },  // 1:50
        { threshold: 105, points: 5.0 },  // 1:45
        { threshold: 100, points: 4.5 },  // 1:40
        { threshold: 95, points: 4.0 },  // 1:35
        { threshold: 90, points: 3.5 },  // 1:30
        { threshold: 85, points: 3.0 },  // 1:25
        { threshold: 80, points: 2.5 },  // 1:20
      ],
    },
    // =====================================================================
    // MALE 40-44
    // =====================================================================
    [AGE_BRACKETS.AGE_40_44]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 845, points: 50.0 },  // 14:05
        { threshold: 869, points: 49.5 },  // 14:29
        { threshold: 893, points: 49.0 },  // 14:53
        { threshold: 917, points: 48.0 },  // 15:17
        { threshold: 941, points: 47.0 },  // 15:41
        { threshold: 965, points: 46.0 },  // 16:05
        { threshold: 989, points: 45.0 },  // 16:29
        { threshold: 1013, points: 44.0 },  // 16:53
        { threshold: 1037, points: 43.0 },  // 17:17
        { threshold: 1061, points: 42.0 },  // 17:41
        { threshold: 1085, points: 41.0 },  // 18:05
        { threshold: 1108, points: 40.0 },  // 18:28
        { threshold: 1132, points: 39.0 },  // 18:52
        { threshold: 1156, points: 38.5 },  // 19:16
        { threshold: 1180, points: 38.0 },  // 19:40
        { threshold: 1204, points: 37.5 },  // 20:04
        { threshold: 1228, points: 37.0 },  // 20:28
        { threshold: 1252, points: 36.5 },  // 20:52
        { threshold: 1276, points: 36.0 },  // 21:16
        { threshold: 1300, points: 35.5 },  // 21:40
        { threshold: 1324, points: 35.0 },  // 22:04
      ],
      [EXERCISES.HAMR]: [
        { threshold: 81, points: 50.0 },
        { threshold: 77, points: 49.5 },
        { threshold: 73, points: 49.0 },
        { threshold: 70, points: 48.0 },
        { threshold: 67, points: 47.0 },
        { threshold: 64, points: 46.0 },
        { threshold: 61, points: 45.0 },
        { threshold: 58, points: 44.0 },
        { threshold: 56, points: 43.0 },
        { threshold: 53, points: 42.0 },
        { threshold: 51, points: 41.0 },
        { threshold: 49, points: 40.0 },
        { threshold: 47, points: 39.0 },
        { threshold: 45, points: 38.5 },
        { threshold: 43, points: 38.0 },
        { threshold: 41, points: 37.5 },
        { threshold: 39, points: 37.0 },
        { threshold: 37, points: 36.5 },
        { threshold: 36, points: 36.0 },
        { threshold: 34, points: 35.5 },
        { threshold: 32, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 52, points: 15.0 },
        { threshold: 51, points: 14.5 },
        { threshold: 50, points: 14.0 },
        { threshold: 49, points: 13.5 },
        { threshold: 48, points: 13.0 },
        { threshold: 46, points: 12.5 },
        { threshold: 45, points: 12.0 },
        { threshold: 44, points: 11.5 },
        { threshold: 42, points: 11.0 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 10.0 },
        { threshold: 39, points: 9.5 },
        { threshold: 37, points: 9.0 },
        { threshold: 36, points: 8.5 },
        { threshold: 35, points: 8.0 },
        { threshold: 33, points: 7.5 },
        { threshold: 32, points: 7.0 },
        { threshold: 31, points: 6.5 },
        { threshold: 30, points: 6.0 },
        { threshold: 28, points: 5.5 },
        { threshold: 27, points: 5.0 },
        { threshold: 26, points: 4.5 },
        { threshold: 24, points: 4.0 },
        { threshold: 23, points: 3.5 },
        { threshold: 22, points: 3.0 },
        { threshold: 21, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.5 },
        { threshold: 42, points: 14.0 },
        { threshold: 41, points: 13.5 },
        { threshold: 40, points: 13.0 },
        { threshold: 39, points: 12.5 },
        { threshold: 38, points: 12.0 },
        { threshold: 37, points: 11.5 },
        { threshold: 36, points: 11.0 },
        { threshold: 35, points: 10.5 },
        { threshold: 34, points: 10.0 },
        { threshold: 33, points: 9.5 },
        { threshold: 32, points: 9.0 },
        { threshold: 31, points: 8.5 },
        { threshold: 30, points: 8.0 },
        { threshold: 29, points: 7.5 },
        { threshold: 28, points: 7.0 },
        { threshold: 27, points: 6.5 },
        { threshold: 26, points: 6.0 },
        { threshold: 25, points: 5.5 },
        { threshold: 24, points: 5.0 },
        { threshold: 23, points: 4.5 },
        { threshold: 22, points: 4.0 },
        { threshold: 21, points: 3.5 },
        { threshold: 20, points: 3.0 },
        { threshold: 19, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 50, points: 15.0 },
        { threshold: 49, points: 14.5 },
        { threshold: 48, points: 14.0 },
        { threshold: 47, points: 13.5 },
        { threshold: 46, points: 13.0 },
        { threshold: 45, points: 12.5 },
        { threshold: 44, points: 12.0 },
        { threshold: 43, points: 11.5 },
        { threshold: 42, points: 11.0 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 10.0 },
        { threshold: 39, points: 9.5 },
        { threshold: 38, points: 9.0 },
        { threshold: 37, points: 8.5 },
        { threshold: 36, points: 8.0 },
        { threshold: 35, points: 7.5 },
        { threshold: 34, points: 7.0 },
        { threshold: 33, points: 6.5 },
        { threshold: 32, points: 6.0 },
        { threshold: 31, points: 5.5 },
        { threshold: 30, points: 5.0 },
        { threshold: 29, points: 4.5 },
        { threshold: 28, points: 4.0 },
        { threshold: 27, points: 3.5 },
        { threshold: 26, points: 3.0 },
        { threshold: 25, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 52, points: 15.0 },
        { threshold: 51, points: 14.5 },
        { threshold: 50, points: 14.0 },
        { threshold: 49, points: 13.5 },
        { threshold: 48, points: 13.0 },
        { threshold: 47, points: 12.5 },
        { threshold: 46, points: 12.0 },
        { threshold: 45, points: 11.5 },
        { threshold: 44, points: 11.0 },
        { threshold: 43, points: 10.5 },
        { threshold: 42, points: 10.0 },
        { threshold: 41, points: 9.5 },
        { threshold: 40, points: 9.0 },
        { threshold: 39, points: 8.5 },
        { threshold: 38, points: 8.0 },
        { threshold: 37, points: 7.5 },
        { threshold: 36, points: 7.0 },
        { threshold: 35, points: 6.5 },
        { threshold: 34, points: 6.0 },
        { threshold: 33, points: 5.5 },
        { threshold: 32, points: 5.0 },
        { threshold: 31, points: 4.5 },
        { threshold: 30, points: 4.0 },
        { threshold: 29, points: 3.5 },
        { threshold: 28, points: 3.0 },
        { threshold: 27, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 200, points: 15.0 },  // 3:20
        { threshold: 195, points: 14.5 },  // 3:15
        { threshold: 190, points: 14.0 },  // 3:10
        { threshold: 185, points: 13.5 },  // 3:05
        { threshold: 180, points: 13.0 },  // 3:00
        { threshold: 175, points: 12.5 },  // 2:55
        { threshold: 170, points: 12.0 },  // 2:50
        { threshold: 165, points: 11.5 },  // 2:45
        { threshold: 160, points: 11.0 },  // 2:40
        { threshold: 155, points: 10.5 },  // 2:35
        { threshold: 150, points: 10.0 },  // 2:30
        { threshold: 145, points: 9.5 },  // 2:25
        { threshold: 140, points: 9.0 },  // 2:20
        { threshold: 135, points: 8.5 },  // 2:15
        { threshold: 130, points: 8.0 },  // 2:10
        { threshold: 125, points: 7.5 },  // 2:05
        { threshold: 120, points: 7.0 },  // 2:00
        { threshold: 115, points: 6.5 },  // 1:55
        { threshold: 110, points: 6.0 },  // 1:50
        { threshold: 105, points: 5.5 },  // 1:45
        { threshold: 100, points: 5.0 },  // 1:40
        { threshold: 95, points: 4.5 },  // 1:35
        { threshold: 90, points: 4.0 },  // 1:30
        { threshold: 85, points: 3.5 },  // 1:25
        { threshold: 80, points: 3.0 },  // 1:20
        { threshold: 75, points: 2.5 },  // 1:15
      ],
    },
    // =====================================================================
    // MALE 45-49
    // =====================================================================
    [AGE_BRACKETS.AGE_45_49]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 870, points: 50.0 },  // 14:30
        { threshold: 894, points: 49.5 },  // 14:54
        { threshold: 918, points: 49.0 },  // 15:18
        { threshold: 942, points: 48.0 },  // 15:42
        { threshold: 965, points: 47.0 },  // 16:05
        { threshold: 989, points: 46.0 },  // 16:29
        { threshold: 1013, points: 45.0 },  // 16:53
        { threshold: 1037, points: 44.0 },  // 17:17
        { threshold: 1061, points: 43.0 },  // 17:41
        { threshold: 1085, points: 42.0 },  // 18:05
        { threshold: 1109, points: 41.0 },  // 18:29
        { threshold: 1132, points: 40.0 },  // 18:52
        { threshold: 1156, points: 39.0 },  // 19:16
        { threshold: 1180, points: 38.5 },  // 19:40
        { threshold: 1204, points: 38.0 },  // 20:04
        { threshold: 1228, points: 37.5 },  // 20:28
        { threshold: 1252, points: 37.0 },  // 20:52
        { threshold: 1275, points: 36.5 },  // 21:15
        { threshold: 1299, points: 36.0 },  // 21:39
        { threshold: 1323, points: 35.5 },  // 22:03
        { threshold: 1347, points: 35.0 },  // 22:27
      ],
      [EXERCISES.HAMR]: [
        { threshold: 77, points: 50.0 },
        { threshold: 73, points: 49.5 },
        { threshold: 70, points: 49.0 },
        { threshold: 67, points: 48.0 },
        { threshold: 64, points: 47.0 },
        { threshold: 61, points: 46.0 },
        { threshold: 58, points: 45.0 },
        { threshold: 56, points: 44.0 },
        { threshold: 53, points: 43.0 },
        { threshold: 51, points: 42.0 },
        { threshold: 49, points: 41.0 },
        { threshold: 47, points: 40.0 },
        { threshold: 45, points: 39.0 },
        { threshold: 43, points: 38.5 },
        { threshold: 41, points: 38.0 },
        { threshold: 39, points: 37.5 },
        { threshold: 37, points: 37.0 },
        { threshold: 36, points: 36.5 },
        { threshold: 34, points: 36.0 },
        { threshold: 32, points: 35.5 },
        { threshold: 31, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 49, points: 15.0 },
        { threshold: 47, points: 14.5 },
        { threshold: 46, points: 14.0 },
        { threshold: 45, points: 13.5 },
        { threshold: 44, points: 13.0 },
        { threshold: 43, points: 12.5 },
        { threshold: 42, points: 12.0 },
        { threshold: 40, points: 11.5 },
        { threshold: 39, points: 11.0 },
        { threshold: 38, points: 10.5 },
        { threshold: 37, points: 10.0 },
        { threshold: 36, points: 9.5 },
        { threshold: 35, points: 9.0 },
        { threshold: 33, points: 8.5 },
        { threshold: 32, points: 8.0 },
        { threshold: 31, points: 7.5 },
        { threshold: 30, points: 7.0 },
        { threshold: 29, points: 6.5 },
        { threshold: 28, points: 6.0 },
        { threshold: 26, points: 5.5 },
        { threshold: 25, points: 5.0 },
        { threshold: 24, points: 4.5 },
        { threshold: 23, points: 4.0 },
        { threshold: 22, points: 3.5 },
        { threshold: 21, points: 3.0 },
        { threshold: 19, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.5 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.5 },
        { threshold: 38, points: 13.0 },
        { threshold: 37, points: 12.5 },
        { threshold: 36, points: 12.0 },
        { threshold: 35, points: 11.5 },
        { threshold: 34, points: 11.0 },
        { threshold: 33, points: 10.5 },
        { threshold: 32, points: 10.0 },
        { threshold: 31, points: 9.5 },
        { threshold: 30, points: 9.0 },
        { threshold: 29, points: 8.5 },
        { threshold: 28, points: 8.0 },
        { threshold: 27, points: 7.5 },
        { threshold: 26, points: 7.0 },
        { threshold: 25, points: 6.5 },
        { threshold: 24, points: 6.0 },
        { threshold: 23, points: 5.5 },
        { threshold: 22, points: 5.0 },
        { threshold: 21, points: 4.5 },
        { threshold: 20, points: 4.0 },
        { threshold: 19, points: 3.5 },
        { threshold: 18, points: 3.0 },
        { threshold: 17, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 48, points: 15.0 },
        { threshold: 47, points: 14.5 },
        { threshold: 46, points: 14.0 },
        { threshold: 45, points: 13.5 },
        { threshold: 44, points: 13.0 },
        { threshold: 43, points: 12.5 },
        { threshold: 42, points: 12.0 },
        { threshold: 41, points: 11.5 },
        { threshold: 40, points: 11.0 },
        { threshold: 39, points: 10.5 },
        { threshold: 38, points: 10.0 },
        { threshold: 37, points: 9.5 },
        { threshold: 36, points: 9.0 },
        { threshold: 35, points: 8.5 },
        { threshold: 34, points: 8.0 },
        { threshold: 33, points: 7.5 },
        { threshold: 32, points: 7.0 },
        { threshold: 31, points: 6.5 },
        { threshold: 30, points: 6.0 },
        { threshold: 29, points: 5.5 },
        { threshold: 28, points: 5.0 },
        { threshold: 27, points: 4.5 },
        { threshold: 26, points: 4.0 },
        { threshold: 25, points: 3.5 },
        { threshold: 24, points: 3.0 },
        { threshold: 23, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 50, points: 15.0 },
        { threshold: 49, points: 14.5 },
        { threshold: 48, points: 14.0 },
        { threshold: 47, points: 13.5 },
        { threshold: 46, points: 13.0 },
        { threshold: 45, points: 12.5 },
        { threshold: 44, points: 12.0 },
        { threshold: 43, points: 11.5 },
        { threshold: 42, points: 11.0 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 10.0 },
        { threshold: 39, points: 9.5 },
        { threshold: 38, points: 9.0 },
        { threshold: 37, points: 8.5 },
        { threshold: 36, points: 8.0 },
        { threshold: 35, points: 7.5 },
        { threshold: 34, points: 7.0 },
        { threshold: 33, points: 6.5 },
        { threshold: 32, points: 6.0 },
        { threshold: 31, points: 5.5 },
        { threshold: 30, points: 5.0 },
        { threshold: 29, points: 4.5 },
        { threshold: 28, points: 4.0 },
        { threshold: 27, points: 3.5 },
        { threshold: 26, points: 3.0 },
        { threshold: 25, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 195, points: 15.0 },  // 3:15
        { threshold: 190, points: 14.5 },  // 3:10
        { threshold: 185, points: 14.0 },  // 3:05
        { threshold: 180, points: 13.5 },  // 3:00
        { threshold: 175, points: 13.0 },  // 2:55
        { threshold: 170, points: 12.5 },  // 2:50
        { threshold: 165, points: 12.0 },  // 2:45
        { threshold: 160, points: 11.5 },  // 2:40
        { threshold: 155, points: 11.0 },  // 2:35
        { threshold: 150, points: 10.5 },  // 2:30
        { threshold: 145, points: 10.0 },  // 2:25
        { threshold: 140, points: 9.5 },  // 2:20
        { threshold: 135, points: 9.0 },  // 2:15
        { threshold: 130, points: 8.5 },  // 2:10
        { threshold: 125, points: 8.0 },  // 2:05
        { threshold: 120, points: 7.5 },  // 2:00
        { threshold: 115, points: 7.0 },  // 1:55
        { threshold: 110, points: 6.5 },  // 1:50
        { threshold: 105, points: 6.0 },  // 1:45
        { threshold: 100, points: 5.5 },  // 1:40
        { threshold: 95, points: 5.0 },  // 1:35
        { threshold: 90, points: 4.5 },  // 1:30
        { threshold: 85, points: 4.0 },  // 1:25
        { threshold: 80, points: 3.5 },  // 1:20
        { threshold: 75, points: 3.0 },  // 1:15
        { threshold: 70, points: 2.5 },  // 1:10
      ],
    },
    // =====================================================================
    // MALE 50-54
    // =====================================================================
    [AGE_BRACKETS.AGE_50_54]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 909, points: 50.0 },  // 15:09
        { threshold: 932, points: 49.5 },  // 15:32
        { threshold: 955, points: 49.0 },  // 15:55
        { threshold: 978, points: 48.0 },  // 16:18
        { threshold: 1001, points: 47.0 },  // 16:41
        { threshold: 1024, points: 46.0 },  // 17:04
        { threshold: 1047, points: 45.0 },  // 17:27
        { threshold: 1070, points: 44.0 },  // 17:50
        { threshold: 1093, points: 43.0 },  // 18:13
        { threshold: 1116, points: 42.0 },  // 18:36
        { threshold: 1140, points: 41.0 },  // 19:00
        { threshold: 1163, points: 40.0 },  // 19:23
        { threshold: 1186, points: 39.0 },  // 19:46
        { threshold: 1209, points: 38.5 },  // 20:09
        { threshold: 1232, points: 38.0 },  // 20:32
        { threshold: 1255, points: 37.5 },  // 20:55
        { threshold: 1278, points: 37.0 },  // 21:18
        { threshold: 1301, points: 36.5 },  // 21:41
        { threshold: 1324, points: 36.0 },  // 22:04
        { threshold: 1347, points: 35.5 },  // 22:27
        { threshold: 1370, points: 35.0 },  // 22:50
      ],
      [EXERCISES.HAMR]: [
        { threshold: 71, points: 50.0 },
        { threshold: 68, points: 49.5 },
        { threshold: 65, points: 49.0 },
        { threshold: 62, points: 48.0 },
        { threshold: 60, points: 47.0 },
        { threshold: 57, points: 46.0 },
        { threshold: 55, points: 45.0 },
        { threshold: 53, points: 44.0 },
        { threshold: 50, points: 43.0 },
        { threshold: 48, points: 42.0 },
        { threshold: 46, points: 41.0 },
        { threshold: 44, points: 40.0 },
        { threshold: 42, points: 39.0 },
        { threshold: 40, points: 38.5 },
        { threshold: 39, points: 38.0 },
        { threshold: 37, points: 37.5 },
        { threshold: 35, points: 37.0 },
        { threshold: 34, points: 36.5 },
        { threshold: 32, points: 36.0 },
        { threshold: 31, points: 35.5 },
        { threshold: 30, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 45, points: 15.0 },
        { threshold: 44, points: 14.5 },
        { threshold: 43, points: 14.0 },
        { threshold: 42, points: 13.5 },
        { threshold: 41, points: 13.0 },
        { threshold: 39, points: 12.5 },
        { threshold: 38, points: 12.0 },
        { threshold: 37, points: 11.5 },
        { threshold: 36, points: 11.0 },
        { threshold: 35, points: 10.5 },
        { threshold: 34, points: 10.0 },
        { threshold: 33, points: 9.5 },
        { threshold: 32, points: 9.0 },
        { threshold: 30, points: 8.5 },
        { threshold: 29, points: 8.0 },
        { threshold: 28, points: 7.5 },
        { threshold: 27, points: 7.0 },
        { threshold: 26, points: 6.5 },
        { threshold: 25, points: 6.0 },
        { threshold: 24, points: 5.5 },
        { threshold: 23, points: 5.0 },
        { threshold: 21, points: 4.5 },
        { threshold: 20, points: 4.0 },
        { threshold: 19, points: 3.5 },
        { threshold: 18, points: 3.0 },
        { threshold: 17, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 40, points: 15.0 },
        { threshold: 39, points: 14.5 },
        { threshold: 38, points: 14.0 },
        { threshold: 37, points: 13.5 },
        { threshold: 36, points: 13.0 },
        { threshold: 35, points: 12.5 },
        { threshold: 34, points: 12.0 },
        { threshold: 33, points: 11.5 },
        { threshold: 32, points: 11.0 },
        { threshold: 31, points: 10.5 },
        { threshold: 30, points: 10.0 },
        { threshold: 29, points: 9.5 },
        { threshold: 28, points: 9.0 },
        { threshold: 27, points: 8.5 },
        { threshold: 26, points: 8.0 },
        { threshold: 25, points: 7.5 },
        { threshold: 24, points: 7.0 },
        { threshold: 23, points: 6.5 },
        { threshold: 22, points: 6.0 },
        { threshold: 21, points: 5.5 },
        { threshold: 20, points: 5.0 },
        { threshold: 19, points: 4.5 },
        { threshold: 18, points: 4.0 },
        { threshold: 17, points: 3.5 },
        { threshold: 16, points: 3.0 },
        { threshold: 15, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 46, points: 15.0 },
        { threshold: 45, points: 14.5 },
        { threshold: 44, points: 14.0 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.0 },
        { threshold: 41, points: 12.5 },
        { threshold: 40, points: 12.0 },
        { threshold: 39, points: 11.5 },
        { threshold: 38, points: 11.0 },
        { threshold: 37, points: 10.5 },
        { threshold: 36, points: 10.0 },
        { threshold: 35, points: 9.5 },
        { threshold: 34, points: 9.0 },
        { threshold: 33, points: 8.5 },
        { threshold: 32, points: 8.0 },
        { threshold: 31, points: 7.5 },
        { threshold: 30, points: 7.0 },
        { threshold: 29, points: 6.5 },
        { threshold: 28, points: 6.0 },
        { threshold: 27, points: 5.5 },
        { threshold: 26, points: 5.0 },
        { threshold: 25, points: 4.5 },
        { threshold: 24, points: 4.0 },
        { threshold: 23, points: 3.5 },
        { threshold: 22, points: 3.0 },
        { threshold: 21, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 48, points: 15.0 },
        { threshold: 47, points: 14.5 },
        { threshold: 46, points: 14.0 },
        { threshold: 45, points: 13.5 },
        { threshold: 44, points: 13.0 },
        { threshold: 43, points: 12.5 },
        { threshold: 42, points: 12.0 },
        { threshold: 41, points: 11.5 },
        { threshold: 40, points: 11.0 },
        { threshold: 39, points: 10.5 },
        { threshold: 38, points: 10.0 },
        { threshold: 37, points: 9.5 },
        { threshold: 36, points: 9.0 },
        { threshold: 35, points: 8.5 },
        { threshold: 34, points: 8.0 },
        { threshold: 33, points: 7.5 },
        { threshold: 32, points: 7.0 },
        { threshold: 31, points: 6.5 },
        { threshold: 30, points: 6.0 },
        { threshold: 29, points: 5.5 },
        { threshold: 28, points: 5.0 },
        { threshold: 27, points: 4.5 },
        { threshold: 26, points: 4.0 },
        { threshold: 25, points: 3.5 },
        { threshold: 24, points: 3.0 },
        { threshold: 23, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 190, points: 15.0 },  // 3:10
        { threshold: 185, points: 14.5 },  // 3:05
        { threshold: 180, points: 14.0 },  // 3:00
        { threshold: 175, points: 13.5 },  // 2:55
        { threshold: 170, points: 13.0 },  // 2:50
        { threshold: 165, points: 12.5 },  // 2:45
        { threshold: 160, points: 12.0 },  // 2:40
        { threshold: 155, points: 11.5 },  // 2:35
        { threshold: 150, points: 11.0 },  // 2:30
        { threshold: 145, points: 10.5 },  // 2:25
        { threshold: 140, points: 10.0 },  // 2:20
        { threshold: 135, points: 9.5 },  // 2:15
        { threshold: 130, points: 9.0 },  // 2:10
        { threshold: 125, points: 8.5 },  // 2:05
        { threshold: 120, points: 8.0 },  // 2:00
        { threshold: 115, points: 7.5 },  // 1:55
        { threshold: 110, points: 7.0 },  // 1:50
        { threshold: 105, points: 6.5 },  // 1:45
        { threshold: 100, points: 6.0 },  // 1:40
        { threshold: 95, points: 5.5 },  // 1:35
        { threshold: 90, points: 5.0 },  // 1:30
        { threshold: 85, points: 4.5 },  // 1:25
        { threshold: 80, points: 4.0 },  // 1:20
        { threshold: 75, points: 3.5 },  // 1:15
        { threshold: 70, points: 3.0 },  // 1:10
        { threshold: 65, points: 2.5 },  // 1:05
      ],
    },
    // =====================================================================
    // MALE 55-59
    // =====================================================================
    [AGE_BRACKETS.AGE_55_59]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 928, points: 50.0 },  // 15:28
        { threshold: 952, points: 49.5 },  // 15:52
        { threshold: 977, points: 49.0 },  // 16:17
        { threshold: 1001, points: 48.0 },  // 16:41
        { threshold: 1026, points: 47.0 },  // 17:06
        { threshold: 1050, points: 46.0 },  // 17:30
        { threshold: 1074, points: 45.0 },  // 17:54
        { threshold: 1099, points: 44.0 },  // 18:19
        { threshold: 1123, points: 43.0 },  // 18:43
        { threshold: 1148, points: 42.0 },  // 19:08
        { threshold: 1172, points: 41.0 },  // 19:32
        { threshold: 1196, points: 40.0 },  // 19:56
        { threshold: 1221, points: 39.0 },  // 20:21
        { threshold: 1245, points: 38.5 },  // 20:45
        { threshold: 1270, points: 38.0 },  // 21:10
        { threshold: 1294, points: 37.5 },  // 21:34
        { threshold: 1318, points: 37.0 },  // 21:58
        { threshold: 1343, points: 36.5 },  // 22:23
        { threshold: 1367, points: 36.0 },  // 22:47
        { threshold: 1392, points: 35.5 },  // 23:12
        { threshold: 1416, points: 35.0 },  // 23:36
      ],
      [EXERCISES.HAMR]: [
        { threshold: 69, points: 50.0 },
        { threshold: 66, points: 49.5 },
        { threshold: 63, points: 49.0 },
        { threshold: 60, points: 48.0 },
        { threshold: 57, points: 47.0 },
        { threshold: 55, points: 46.0 },
        { threshold: 52, points: 45.0 },
        { threshold: 50, points: 44.0 },
        { threshold: 48, points: 43.0 },
        { threshold: 45, points: 42.0 },
        { threshold: 43, points: 41.0 },
        { threshold: 41, points: 40.0 },
        { threshold: 40, points: 39.0 },
        { threshold: 38, points: 38.5 },
        { threshold: 36, points: 38.0 },
        { threshold: 34, points: 37.5 },
        { threshold: 33, points: 37.0 },
        { threshold: 31, points: 36.5 },
        { threshold: 30, points: 36.0 },
        { threshold: 28, points: 35.5 },
        { threshold: 27, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.5 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.5 },
        { threshold: 38, points: 13.0 },
        { threshold: 36, points: 12.5 },
        { threshold: 35, points: 12.0 },
        { threshold: 34, points: 11.5 },
        { threshold: 33, points: 11.0 },
        { threshold: 32, points: 10.5 },
        { threshold: 31, points: 10.0 },
        { threshold: 30, points: 9.5 },
        { threshold: 29, points: 9.0 },
        { threshold: 27, points: 8.5 },
        { threshold: 26, points: 8.0 },
        { threshold: 25, points: 7.5 },
        { threshold: 24, points: 7.0 },
        { threshold: 23, points: 6.5 },
        { threshold: 22, points: 6.0 },
        { threshold: 21, points: 5.5 },
        { threshold: 20, points: 5.0 },
        { threshold: 18, points: 4.5 },
        { threshold: 17, points: 4.0 },
        { threshold: 16, points: 3.5 },
        { threshold: 15, points: 3.0 },
        { threshold: 14, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 38, points: 15.0 },
        { threshold: 37, points: 14.5 },
        { threshold: 36, points: 14.0 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.0 },
        { threshold: 33, points: 12.5 },
        { threshold: 32, points: 12.0 },
        { threshold: 31, points: 11.5 },
        { threshold: 30, points: 11.0 },
        { threshold: 29, points: 10.5 },
        { threshold: 28, points: 10.0 },
        { threshold: 27, points: 9.5 },
        { threshold: 26, points: 9.0 },
        { threshold: 25, points: 8.5 },
        { threshold: 24, points: 8.0 },
        { threshold: 23, points: 7.5 },
        { threshold: 22, points: 7.0 },
        { threshold: 21, points: 6.5 },
        { threshold: 20, points: 6.0 },
        { threshold: 19, points: 5.5 },
        { threshold: 18, points: 5.0 },
        { threshold: 17, points: 4.5 },
        { threshold: 16, points: 4.0 },
        { threshold: 15, points: 3.5 },
        { threshold: 14, points: 3.0 },
        { threshold: 13, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.5 },
        { threshold: 42, points: 14.0 },
        { threshold: 41, points: 13.5 },
        { threshold: 40, points: 13.0 },
        { threshold: 39, points: 12.5 },
        { threshold: 38, points: 12.0 },
        { threshold: 37, points: 11.5 },
        { threshold: 36, points: 11.0 },
        { threshold: 35, points: 10.5 },
        { threshold: 34, points: 10.0 },
        { threshold: 33, points: 9.5 },
        { threshold: 32, points: 9.0 },
        { threshold: 31, points: 8.5 },
        { threshold: 30, points: 8.0 },
        { threshold: 29, points: 7.5 },
        { threshold: 28, points: 7.0 },
        { threshold: 27, points: 6.5 },
        { threshold: 26, points: 6.0 },
        { threshold: 25, points: 5.5 },
        { threshold: 24, points: 5.0 },
        { threshold: 23, points: 4.5 },
        { threshold: 22, points: 4.0 },
        { threshold: 21, points: 3.5 },
        { threshold: 20, points: 3.0 },
        { threshold: 19, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 46, points: 15.0 },
        { threshold: 45, points: 14.5 },
        { threshold: 44, points: 14.0 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.0 },
        { threshold: 41, points: 12.5 },
        { threshold: 40, points: 12.0 },
        { threshold: 39, points: 11.5 },
        { threshold: 38, points: 11.0 },
        { threshold: 37, points: 10.5 },
        { threshold: 36, points: 10.0 },
        { threshold: 35, points: 9.5 },
        { threshold: 34, points: 9.0 },
        { threshold: 33, points: 8.5 },
        { threshold: 32, points: 8.0 },
        { threshold: 31, points: 7.5 },
        { threshold: 30, points: 7.0 },
        { threshold: 29, points: 6.5 },
        { threshold: 28, points: 6.0 },
        { threshold: 27, points: 5.5 },
        { threshold: 26, points: 5.0 },
        { threshold: 25, points: 4.5 },
        { threshold: 24, points: 4.0 },
        { threshold: 23, points: 3.5 },
        { threshold: 22, points: 3.0 },
        { threshold: 21, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 185, points: 15.0 },  // 3:05
        { threshold: 180, points: 14.5 },  // 3:00
        { threshold: 175, points: 14.0 },  // 2:55
        { threshold: 170, points: 13.5 },  // 2:50
        { threshold: 165, points: 13.0 },  // 2:45
        { threshold: 160, points: 12.5 },  // 2:40
        { threshold: 155, points: 12.0 },  // 2:35
        { threshold: 150, points: 11.5 },  // 2:30
        { threshold: 145, points: 11.0 },  // 2:25
        { threshold: 140, points: 10.5 },  // 2:20
        { threshold: 135, points: 10.0 },  // 2:15
        { threshold: 130, points: 9.5 },  // 2:10
        { threshold: 125, points: 9.0 },  // 2:05
        { threshold: 120, points: 8.5 },  // 2:00
        { threshold: 115, points: 8.0 },  // 1:55
        { threshold: 110, points: 7.5 },  // 1:50
        { threshold: 105, points: 7.0 },  // 1:45
        { threshold: 100, points: 6.5 },  // 1:40
        { threshold: 95, points: 6.0 },  // 1:35
        { threshold: 90, points: 5.5 },  // 1:30
        { threshold: 85, points: 5.0 },  // 1:25
        { threshold: 80, points: 4.5 },  // 1:20
        { threshold: 75, points: 4.0 },  // 1:15
        { threshold: 70, points: 3.5 },  // 1:10
        { threshold: 65, points: 3.0 },  // 1:05
        { threshold: 60, points: 2.5 },  // 1:00
      ],
    },
    // =====================================================================
    // MALE 60+
    // =====================================================================
    [AGE_BRACKETS.AGE_60_PLUS]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1018, points: 50.0 },  // 16:58
        { threshold: 1039, points: 49.5 },  // 17:19
        { threshold: 1060, points: 49.0 },  // 17:40
        { threshold: 1081, points: 48.0 },  // 18:01
        { threshold: 1102, points: 47.0 },  // 18:22
        { threshold: 1124, points: 46.0 },  // 18:44
        { threshold: 1145, points: 45.0 },  // 19:05
        { threshold: 1166, points: 44.0 },  // 19:26
        { threshold: 1187, points: 43.0 },  // 19:47
        { threshold: 1208, points: 42.0 },  // 20:08
        { threshold: 1229, points: 41.0 },  // 20:29
        { threshold: 1250, points: 40.0 },  // 20:50
        { threshold: 1271, points: 39.0 },  // 21:11
        { threshold: 1292, points: 38.5 },  // 21:32
        { threshold: 1313, points: 38.0 },  // 21:53
        { threshold: 1335, points: 37.5 },  // 22:15
        { threshold: 1347, points: 37.0 },  // 22:27
        { threshold: 1356, points: 36.5 },  // 22:36
        { threshold: 1398, points: 36.0 },  // 23:18
        { threshold: 1419, points: 35.5 },  // 23:39
        { threshold: 1440, points: 35.0 },  // 24:00
      ],
      [EXERCISES.HAMR]: [
        { threshold: 65, points: 50.0 },
        { threshold: 62, points: 49.5 },
        { threshold: 59, points: 49.0 },
        { threshold: 56, points: 48.0 },
        { threshold: 54, points: 47.0 },
        { threshold: 52, points: 46.0 },
        { threshold: 49, points: 45.0 },
        { threshold: 47, points: 44.0 },
        { threshold: 45, points: 43.0 },
        { threshold: 43, points: 42.0 },
        { threshold: 41, points: 41.0 },
        { threshold: 39, points: 40.0 },
        { threshold: 38, points: 39.0 },
        { threshold: 36, points: 38.5 },
        { threshold: 34, points: 38.0 },
        { threshold: 33, points: 37.5 },
        { threshold: 31, points: 37.0 },
        { threshold: 30, points: 36.5 },
        { threshold: 28, points: 36.0 },
        { threshold: 27, points: 35.5 },
        { threshold: 26, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 38, points: 15.0 },
        { threshold: 37, points: 14.5 },
        { threshold: 36, points: 14.0 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.0 },
        { threshold: 33, points: 12.5 },
        { threshold: 32, points: 12.0 },
        { threshold: 31, points: 11.5 },
        { threshold: 30, points: 11.0 },
        { threshold: 29, points: 10.5 },
        { threshold: 28, points: 10.0 },
        { threshold: 27, points: 9.5 },
        { threshold: 26, points: 9.0 },
        { threshold: 24, points: 8.5 },
        { threshold: 23, points: 8.0 },
        { threshold: 22, points: 7.5 },
        { threshold: 21, points: 7.0 },
        { threshold: 20, points: 6.5 },
        { threshold: 19, points: 6.0 },
        { threshold: 18, points: 5.5 },
        { threshold: 17, points: 5.0 },
        { threshold: 16, points: 4.5 },
        { threshold: 15, points: 4.0 },
        { threshold: 14, points: 3.5 },
        { threshold: 13, points: 3.0 },
        { threshold: 12, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 36, points: 15.0 },
        { threshold: 35, points: 14.5 },
        { threshold: 34, points: 14.0 },
        { threshold: 33, points: 13.5 },
        { threshold: 32, points: 13.0 },
        { threshold: 31, points: 12.5 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.5 },
        { threshold: 28, points: 11.0 },
        { threshold: 27, points: 10.5 },
        { threshold: 26, points: 10.0 },
        { threshold: 25, points: 9.5 },
        { threshold: 24, points: 9.0 },
        { threshold: 23, points: 8.5 },
        { threshold: 22, points: 8.0 },
        { threshold: 21, points: 7.5 },
        { threshold: 20, points: 7.0 },
        { threshold: 19, points: 6.5 },
        { threshold: 18, points: 6.0 },
        { threshold: 17, points: 5.5 },
        { threshold: 16, points: 5.0 },
        { threshold: 15, points: 4.5 },
        { threshold: 14, points: 4.0 },
        { threshold: 13, points: 3.5 },
        { threshold: 12, points: 3.0 },
        { threshold: 11, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.5 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.5 },
        { threshold: 38, points: 13.0 },
        { threshold: 37, points: 12.5 },
        { threshold: 36, points: 12.0 },
        { threshold: 35, points: 11.5 },
        { threshold: 34, points: 11.0 },
        { threshold: 33, points: 10.5 },
        { threshold: 32, points: 10.0 },
        { threshold: 31, points: 9.5 },
        { threshold: 30, points: 9.0 },
        { threshold: 29, points: 8.5 },
        { threshold: 28, points: 8.0 },
        { threshold: 27, points: 7.5 },
        { threshold: 26, points: 7.0 },
        { threshold: 25, points: 6.5 },
        { threshold: 24, points: 6.0 },
        { threshold: 23, points: 5.5 },
        { threshold: 22, points: 5.0 },
        { threshold: 21, points: 4.5 },
        { threshold: 20, points: 4.0 },
        { threshold: 19, points: 3.5 },
        { threshold: 18, points: 3.0 },
        { threshold: 17, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.5 },
        { threshold: 42, points: 14.0 },
        { threshold: 41, points: 13.5 },
        { threshold: 40, points: 13.0 },
        { threshold: 39, points: 12.5 },
        { threshold: 38, points: 12.0 },
        { threshold: 37, points: 11.5 },
        { threshold: 36, points: 11.0 },
        { threshold: 35, points: 10.5 },
        { threshold: 34, points: 10.0 },
        { threshold: 33, points: 9.5 },
        { threshold: 32, points: 9.0 },
        { threshold: 31, points: 8.5 },
        { threshold: 30, points: 8.0 },
        { threshold: 29, points: 7.5 },
        { threshold: 28, points: 7.0 },
        { threshold: 27, points: 6.5 },
        { threshold: 26, points: 6.0 },
        { threshold: 25, points: 5.5 },
        { threshold: 24, points: 5.0 },
        { threshold: 23, points: 4.5 },
        { threshold: 22, points: 4.0 },
        { threshold: 21, points: 3.5 },
        { threshold: 20, points: 3.0 },
        { threshold: 19, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 180, points: 15.0 },  // 3:00
        { threshold: 175, points: 14.5 },  // 2:55
        { threshold: 170, points: 14.0 },  // 2:50
        { threshold: 165, points: 13.5 },  // 2:45
        { threshold: 160, points: 13.0 },  // 2:40
        { threshold: 155, points: 12.5 },  // 2:35
        { threshold: 150, points: 12.0 },  // 2:30
        { threshold: 145, points: 11.5 },  // 2:25
        { threshold: 140, points: 11.0 },  // 2:20
        { threshold: 135, points: 10.5 },  // 2:15
        { threshold: 130, points: 10.0 },  // 2:10
        { threshold: 125, points: 9.5 },  // 2:05
        { threshold: 120, points: 9.0 },  // 2:00
        { threshold: 115, points: 8.5 },  // 1:55
        { threshold: 110, points: 8.0 },  // 1:50
        { threshold: 105, points: 7.5 },  // 1:45
        { threshold: 100, points: 7.0 },  // 1:40
        { threshold: 95, points: 6.5 },  // 1:35
        { threshold: 90, points: 6.0 },  // 1:30
        { threshold: 85, points: 5.5 },  // 1:25
        { threshold: 80, points: 5.0 },  // 1:20
        { threshold: 75, points: 4.5 },  // 1:15
        { threshold: 70, points: 4.0 },  // 1:10
        { threshold: 65, points: 3.5 },  // 1:05
        { threshold: 60, points: 3.0 },  // 1:00
        { threshold: 55, points: 2.5 },  // 0:55
      ],
    },
  },
  [GENDER.FEMALE]: {
    // =====================================================================
    // FEMALE <25
    // =====================================================================
    [AGE_BRACKETS.UNDER_25]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 930, points: 50.0 },  // 15:30
        { threshold: 960, points: 49.5 },  // 16:00
        { threshold: 989, points: 49.0 },  // 16:29
        { threshold: 1019, points: 48.0 },  // 16:59
        { threshold: 1049, points: 47.0 },  // 17:29
        { threshold: 1078, points: 46.0 },  // 17:58
        { threshold: 1108, points: 45.0 },  // 18:28
        { threshold: 1138, points: 44.0 },  // 18:58
        { threshold: 1167, points: 43.0 },  // 19:27
        { threshold: 1197, points: 42.0 },  // 19:57
        { threshold: 1227, points: 41.0 },  // 20:27
        { threshold: 1256, points: 40.0 },  // 20:56
        { threshold: 1286, points: 39.0 },  // 21:26
        { threshold: 1315, points: 38.5 },  // 21:55
        { threshold: 1345, points: 38.0 },  // 22:25
        { threshold: 1375, points: 37.5 },  // 22:55
        { threshold: 1404, points: 37.0 },  // 23:24
        { threshold: 1434, points: 36.5 },  // 23:54
        { threshold: 1464, points: 36.0 },  // 24:24
        { threshold: 1493, points: 35.5 },  // 24:53
        { threshold: 1523, points: 35.0 },  // 25:23
      ],
      [EXERCISES.HAMR]: [
        { threshold: 68, points: 50.0 },
        { threshold: 65, points: 49.5 },
        { threshold: 61, points: 49.0 },
        { threshold: 58, points: 48.0 },
        { threshold: 55, points: 47.0 },
        { threshold: 52, points: 46.0 },
        { threshold: 49, points: 45.0 },
        { threshold: 46, points: 44.0 },
        { threshold: 44, points: 43.0 },
        { threshold: 41, points: 42.0 },
        { threshold: 39, points: 41.0 },
        { threshold: 37, points: 40.0 },
        { threshold: 35, points: 39.0 },
        { threshold: 33, points: 38.5 },
        { threshold: 31, points: 38.0 },
        { threshold: 29, points: 37.5 },
        { threshold: 28, points: 37.0 },
        { threshold: 26, points: 36.5 },
        { threshold: 24, points: 36.0 },
        { threshold: 23, points: 35.5 },
        { threshold: 21, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 50, points: 15.0 },
        { threshold: 49, points: 14.5 },
        { threshold: 47, points: 14.0 },
        { threshold: 46, points: 13.5 },
        { threshold: 44, points: 13.0 },
        { threshold: 43, points: 12.5 },
        { threshold: 42, points: 12.0 },
        { threshold: 40, points: 11.5 },
        { threshold: 39, points: 11.0 },
        { threshold: 37, points: 10.5 },
        { threshold: 36, points: 10.0 },
        { threshold: 35, points: 9.5 },
        { threshold: 33, points: 9.0 },
        { threshold: 32, points: 8.5 },
        { threshold: 30, points: 8.0 },
        { threshold: 29, points: 7.5 },
        { threshold: 28, points: 7.0 },
        { threshold: 26, points: 6.5 },
        { threshold: 25, points: 6.0 },
        { threshold: 23, points: 5.5 },
        { threshold: 22, points: 5.0 },
        { threshold: 21, points: 4.5 },
        { threshold: 19, points: 4.0 },
        { threshold: 18, points: 3.5 },
        { threshold: 16, points: 3.0 },
        { threshold: 15, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.5 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.5 },
        { threshold: 38, points: 13.0 },
        { threshold: 37, points: 12.5 },
        { threshold: 36, points: 12.0 },
        { threshold: 35, points: 11.5 },
        { threshold: 34, points: 11.0 },
        { threshold: 33, points: 10.5 },
        { threshold: 32, points: 10.0 },
        { threshold: 31, points: 9.5 },
        { threshold: 30, points: 9.0 },
        { threshold: 29, points: 8.5 },
        { threshold: 28, points: 8.0 },
        { threshold: 27, points: 7.5 },
        { threshold: 26, points: 7.0 },
        { threshold: 25, points: 6.5 },
        { threshold: 24, points: 6.0 },
        { threshold: 23, points: 5.5 },
        { threshold: 22, points: 5.0 },
        { threshold: 21, points: 4.5 },
        { threshold: 20, points: 4.0 },
        { threshold: 19, points: 3.5 },
        { threshold: 18, points: 3.0 },
        { threshold: 17, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 54, points: 15.0 },
        { threshold: 53, points: 14.5 },
        { threshold: 52, points: 14.0 },
        { threshold: 51, points: 13.5 },
        { threshold: 50, points: 13.0 },
        { threshold: 49, points: 12.5 },
        { threshold: 48, points: 12.0 },
        { threshold: 47, points: 11.5 },
        { threshold: 46, points: 11.0 },
        { threshold: 45, points: 10.5 },
        { threshold: 44, points: 10.0 },
        { threshold: 43, points: 9.5 },
        { threshold: 42, points: 9.0 },
        { threshold: 41, points: 8.5 },
        { threshold: 40, points: 8.0 },
        { threshold: 39, points: 7.5 },
        { threshold: 38, points: 7.0 },
        { threshold: 37, points: 6.5 },
        { threshold: 36, points: 6.0 },
        { threshold: 35, points: 5.5 },
        { threshold: 34, points: 5.0 },
        { threshold: 33, points: 4.5 },
        { threshold: 32, points: 4.0 },
        { threshold: 31, points: 3.5 },
        { threshold: 30, points: 3.0 },
        { threshold: 29, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 58, points: 15.0 },
        { threshold: 57, points: 14.5 },
        { threshold: 56, points: 14.0 },
        { threshold: 55, points: 13.5 },
        { threshold: 54, points: 13.0 },
        { threshold: 53, points: 12.5 },
        { threshold: 52, points: 12.0 },
        { threshold: 51, points: 11.5 },
        { threshold: 50, points: 11.0 },
        { threshold: 49, points: 10.5 },
        { threshold: 48, points: 10.0 },
        { threshold: 47, points: 9.5 },
        { threshold: 46, points: 9.0 },
        { threshold: 45, points: 8.5 },
        { threshold: 44, points: 8.0 },
        { threshold: 43, points: 7.5 },
        { threshold: 42, points: 7.0 },
        { threshold: 41, points: 6.5 },
        { threshold: 40, points: 6.0 },
        { threshold: 39, points: 5.5 },
        { threshold: 38, points: 5.0 },
        { threshold: 37, points: 4.5 },
        { threshold: 36, points: 4.0 },
        { threshold: 35, points: 3.5 },
        { threshold: 34, points: 3.0 },
        { threshold: 33, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 215, points: 15.0 },  // 3:35
        { threshold: 210, points: 14.5 },  // 3:30
        { threshold: 205, points: 14.0 },  // 3:25
        { threshold: 200, points: 13.5 },  // 3:20
        { threshold: 195, points: 13.0 },  // 3:15
        { threshold: 190, points: 12.5 },  // 3:10
        { threshold: 185, points: 12.0 },  // 3:05
        { threshold: 180, points: 11.5 },  // 3:00
        { threshold: 175, points: 11.0 },  // 2:55
        { threshold: 170, points: 10.5 },  // 2:50
        { threshold: 165, points: 10.0 },  // 2:45
        { threshold: 160, points: 9.5 },  // 2:40
        { threshold: 155, points: 9.0 },  // 2:35
        { threshold: 150, points: 8.5 },  // 2:30
        { threshold: 145, points: 8.0 },  // 2:25
        { threshold: 140, points: 7.5 },  // 2:20
        { threshold: 135, points: 7.0 },  // 2:15
        { threshold: 130, points: 6.5 },  // 2:10
        { threshold: 125, points: 6.0 },  // 2:05
        { threshold: 120, points: 5.5 },  // 2:00
        { threshold: 115, points: 5.0 },  // 1:55
        { threshold: 110, points: 4.5 },  // 1:50
        { threshold: 105, points: 4.0 },  // 1:45
        { threshold: 100, points: 3.5 },  // 1:40
        { threshold: 95, points: 3.0 },  // 1:35
        { threshold: 90, points: 2.5 },  // 1:30
      ],
    },
    // =====================================================================
    // FEMALE 25-29
    // =====================================================================
    [AGE_BRACKETS.AGE_25_29]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 955, points: 50.0 },  // 15:55
        { threshold: 984, points: 49.5 },  // 16:24
        { threshold: 1014, points: 49.0 },  // 16:54
        { threshold: 1043, points: 48.0 },  // 17:23
        { threshold: 1072, points: 47.0 },  // 17:52
        { threshold: 1101, points: 46.0 },  // 18:21
        { threshold: 1131, points: 45.0 },  // 18:51
        { threshold: 1160, points: 44.0 },  // 19:20
        { threshold: 1189, points: 43.0 },  // 19:49
        { threshold: 1218, points: 42.0 },  // 20:18
        { threshold: 1248, points: 41.0 },  // 20:48
        { threshold: 1277, points: 40.0 },  // 21:17
        { threshold: 1306, points: 39.0 },  // 21:46
        { threshold: 1335, points: 38.5 },  // 22:15
        { threshold: 1365, points: 38.0 },  // 22:45
        { threshold: 1394, points: 37.5 },  // 23:14
        { threshold: 1423, points: 37.0 },  // 23:43
        { threshold: 1452, points: 36.5 },  // 24:12
        { threshold: 1482, points: 36.0 },  // 24:42
        { threshold: 1511, points: 35.5 },  // 25:11
        { threshold: 1540, points: 35.0 },  // 25:40
      ],
      [EXERCISES.HAMR]: [
        { threshold: 65, points: 50.0 },
        { threshold: 62, points: 49.5 },
        { threshold: 58, points: 49.0 },
        { threshold: 55, points: 48.0 },
        { threshold: 52, points: 47.0 },
        { threshold: 50, points: 46.0 },
        { threshold: 47, points: 45.0 },
        { threshold: 44, points: 44.0 },
        { threshold: 42, points: 43.0 },
        { threshold: 40, points: 42.0 },
        { threshold: 38, points: 41.0 },
        { threshold: 36, points: 40.0 },
        { threshold: 34, points: 39.0 },
        { threshold: 32, points: 38.5 },
        { threshold: 30, points: 38.0 },
        { threshold: 28, points: 37.5 },
        { threshold: 26, points: 37.0 },
        { threshold: 25, points: 36.5 },
        { threshold: 23, points: 36.0 },
        { threshold: 22, points: 35.5 },
        { threshold: 20, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 47, points: 15.0 },
        { threshold: 46, points: 14.5 },
        { threshold: 44, points: 14.0 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.0 },
        { threshold: 40, points: 12.5 },
        { threshold: 39, points: 12.0 },
        { threshold: 38, points: 11.5 },
        { threshold: 36, points: 11.0 },
        { threshold: 35, points: 10.5 },
        { threshold: 34, points: 10.0 },
        { threshold: 32, points: 9.5 },
        { threshold: 31, points: 9.0 },
        { threshold: 30, points: 8.5 },
        { threshold: 29, points: 8.0 },
        { threshold: 27, points: 7.5 },
        { threshold: 26, points: 7.0 },
        { threshold: 25, points: 6.5 },
        { threshold: 23, points: 6.0 },
        { threshold: 22, points: 5.5 },
        { threshold: 21, points: 5.0 },
        { threshold: 19, points: 4.5 },
        { threshold: 18, points: 4.0 },
        { threshold: 17, points: 3.5 },
        { threshold: 15, points: 3.0 },
        { threshold: 14, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 40, points: 15.0 },
        { threshold: 39, points: 14.5 },
        { threshold: 38, points: 14.0 },
        { threshold: 37, points: 13.5 },
        { threshold: 36, points: 13.0 },
        { threshold: 35, points: 12.5 },
        { threshold: 34, points: 12.0 },
        { threshold: 33, points: 11.5 },
        { threshold: 32, points: 11.0 },
        { threshold: 31, points: 10.5 },
        { threshold: 30, points: 10.0 },
        { threshold: 29, points: 9.5 },
        { threshold: 28, points: 9.0 },
        { threshold: 27, points: 8.5 },
        { threshold: 26, points: 8.0 },
        { threshold: 25, points: 7.5 },
        { threshold: 24, points: 7.0 },
        { threshold: 23, points: 6.5 },
        { threshold: 22, points: 6.0 },
        { threshold: 21, points: 5.5 },
        { threshold: 20, points: 5.0 },
        { threshold: 19, points: 4.5 },
        { threshold: 18, points: 4.0 },
        { threshold: 17, points: 3.5 },
        { threshold: 16, points: 3.0 },
        { threshold: 15, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 50, points: 15.0 },
        { threshold: 49, points: 14.5 },
        { threshold: 48, points: 14.0 },
        { threshold: 47, points: 13.5 },
        { threshold: 46, points: 13.0 },
        { threshold: 45, points: 12.5 },
        { threshold: 44, points: 12.0 },
        { threshold: 43, points: 11.5 },
        { threshold: 42, points: 11.0 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 10.0 },
        { threshold: 39, points: 9.5 },
        { threshold: 38, points: 9.0 },
        { threshold: 37, points: 8.5 },
        { threshold: 36, points: 8.0 },
        { threshold: 35, points: 7.5 },
        { threshold: 34, points: 7.0 },
        { threshold: 33, points: 6.5 },
        { threshold: 32, points: 6.0 },
        { threshold: 31, points: 5.5 },
        { threshold: 30, points: 5.0 },
        { threshold: 29, points: 4.5 },
        { threshold: 28, points: 4.0 },
        { threshold: 27, points: 3.5 },
        { threshold: 26, points: 3.0 },
        { threshold: 25, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 56, points: 15.0 },
        { threshold: 55, points: 14.5 },
        { threshold: 54, points: 14.0 },
        { threshold: 53, points: 13.5 },
        { threshold: 52, points: 13.0 },
        { threshold: 51, points: 12.5 },
        { threshold: 50, points: 12.0 },
        { threshold: 49, points: 11.5 },
        { threshold: 48, points: 11.0 },
        { threshold: 47, points: 10.5 },
        { threshold: 46, points: 10.0 },
        { threshold: 45, points: 9.5 },
        { threshold: 44, points: 9.0 },
        { threshold: 43, points: 8.5 },
        { threshold: 42, points: 8.0 },
        { threshold: 41, points: 7.5 },
        { threshold: 40, points: 7.0 },
        { threshold: 39, points: 6.5 },
        { threshold: 38, points: 6.0 },
        { threshold: 37, points: 5.5 },
        { threshold: 36, points: 5.0 },
        { threshold: 35, points: 4.5 },
        { threshold: 34, points: 4.0 },
        { threshold: 33, points: 3.5 },
        { threshold: 32, points: 3.0 },
        { threshold: 31, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 210, points: 15.0 },  // 3:30
        { threshold: 205, points: 14.5 },  // 3:25
        { threshold: 200, points: 14.0 },  // 3:20
        { threshold: 195, points: 13.5 },  // 3:15
        { threshold: 190, points: 13.0 },  // 3:10
        { threshold: 185, points: 12.5 },  // 3:05
        { threshold: 180, points: 12.0 },  // 3:00
        { threshold: 175, points: 11.5 },  // 2:55
        { threshold: 170, points: 11.0 },  // 2:50
        { threshold: 165, points: 10.5 },  // 2:45
        { threshold: 160, points: 10.0 },  // 2:40
        { threshold: 155, points: 9.5 },  // 2:35
        { threshold: 150, points: 9.0 },  // 2:30
        { threshold: 145, points: 8.5 },  // 2:25
        { threshold: 140, points: 8.0 },  // 2:20
        { threshold: 135, points: 7.5 },  // 2:15
        { threshold: 130, points: 7.0 },  // 2:10
        { threshold: 125, points: 6.5 },  // 2:05
        { threshold: 120, points: 6.0 },  // 2:00
        { threshold: 115, points: 5.5 },  // 1:55
        { threshold: 110, points: 5.0 },  // 1:50
        { threshold: 105, points: 4.5 },  // 1:45
        { threshold: 100, points: 4.0 },  // 1:40
        { threshold: 95, points: 3.5 },  // 1:35
        { threshold: 90, points: 3.0 },  // 1:30
        { threshold: 85, points: 2.5 },  // 1:25
      ],
    },
    // =====================================================================
    // FEMALE 30-34
    // =====================================================================
    [AGE_BRACKETS.AGE_30_34]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 970, points: 50.0 },  // 16:10
        { threshold: 1000, points: 49.5 },  // 16:40
        { threshold: 1031, points: 49.0 },  // 17:11
        { threshold: 1061, points: 48.0 },  // 17:41
        { threshold: 1091, points: 47.0 },  // 18:11
        { threshold: 1121, points: 46.0 },  // 18:41
        { threshold: 1152, points: 45.0 },  // 19:12
        { threshold: 1182, points: 44.0 },  // 19:42
        { threshold: 1212, points: 43.0 },  // 20:12
        { threshold: 1242, points: 42.0 },  // 20:42
        { threshold: 1273, points: 41.0 },  // 21:13
        { threshold: 1303, points: 40.0 },  // 21:43
        { threshold: 1333, points: 39.0 },  // 22:13
        { threshold: 1363, points: 38.5 },  // 22:43
        { threshold: 1394, points: 38.0 },  // 23:14
        { threshold: 1424, points: 37.5 },  // 23:44
        { threshold: 1454, points: 37.0 },  // 24:14
        { threshold: 1484, points: 36.5 },  // 24:44
        { threshold: 1515, points: 36.0 },  // 25:15
        { threshold: 1545, points: 35.5 },  // 25:45
        { threshold: 1575, points: 35.0 },  // 26:15
      ],
      [EXERCISES.HAMR]: [
        { threshold: 63, points: 50.0 },
        { threshold: 60, points: 49.5 },
        { threshold: 57, points: 49.0 },
        { threshold: 53, points: 48.0 },
        { threshold: 51, points: 47.0 },
        { threshold: 48, points: 46.0 },
        { threshold: 45, points: 45.0 },
        { threshold: 43, points: 44.0 },
        { threshold: 40, points: 43.0 },
        { threshold: 38, points: 42.0 },
        { threshold: 36, points: 41.0 },
        { threshold: 34, points: 40.0 },
        { threshold: 32, points: 39.0 },
        { threshold: 30, points: 38.5 },
        { threshold: 28, points: 38.0 },
        { threshold: 26, points: 37.5 },
        { threshold: 25, points: 37.0 },
        { threshold: 23, points: 36.5 },
        { threshold: 22, points: 36.0 },
        { threshold: 20, points: 35.5 },
        { threshold: 19, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 44, points: 15.0 },
        { threshold: 42, points: 14.5 },
        { threshold: 41, points: 14.0 },
        { threshold: 40, points: 13.5 },
        { threshold: 39, points: 13.0 },
        { threshold: 37, points: 12.5 },
        { threshold: 36, points: 12.0 },
        { threshold: 35, points: 11.5 },
        { threshold: 34, points: 11.0 },
        { threshold: 32, points: 10.5 },
        { threshold: 31, points: 10.0 },
        { threshold: 30, points: 9.5 },
        { threshold: 29, points: 9.0 },
        { threshold: 27, points: 8.5 },
        { threshold: 26, points: 8.0 },
        { threshold: 25, points: 7.5 },
        { threshold: 24, points: 7.0 },
        { threshold: 22, points: 6.5 },
        { threshold: 21, points: 6.0 },
        { threshold: 20, points: 5.5 },
        { threshold: 19, points: 5.0 },
        { threshold: 17, points: 4.5 },
        { threshold: 16, points: 4.0 },
        { threshold: 15, points: 3.5 },
        { threshold: 14, points: 3.0 },
        { threshold: 12, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 38, points: 15.0 },
        { threshold: 37, points: 14.5 },
        { threshold: 36, points: 14.0 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.0 },
        { threshold: 33, points: 12.5 },
        { threshold: 32, points: 12.0 },
        { threshold: 31, points: 11.5 },
        { threshold: 30, points: 11.0 },
        { threshold: 29, points: 10.5 },
        { threshold: 28, points: 10.0 },
        { threshold: 27, points: 9.5 },
        { threshold: 26, points: 9.0 },
        { threshold: 25, points: 8.5 },
        { threshold: 24, points: 8.0 },
        { threshold: 23, points: 7.5 },
        { threshold: 22, points: 7.0 },
        { threshold: 21, points: 6.5 },
        { threshold: 20, points: 6.0 },
        { threshold: 19, points: 5.5 },
        { threshold: 18, points: 5.0 },
        { threshold: 17, points: 4.5 },
        { threshold: 16, points: 4.0 },
        { threshold: 15, points: 3.5 },
        { threshold: 14, points: 3.0 },
        { threshold: 13, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 45, points: 15.0 },
        { threshold: 44, points: 14.5 },
        { threshold: 43, points: 14.0 },
        { threshold: 42, points: 13.5 },
        { threshold: 41, points: 13.0 },
        { threshold: 40, points: 12.5 },
        { threshold: 39, points: 12.0 },
        { threshold: 38, points: 11.5 },
        { threshold: 37, points: 11.0 },
        { threshold: 36, points: 10.5 },
        { threshold: 35, points: 10.0 },
        { threshold: 34, points: 9.5 },
        { threshold: 33, points: 9.0 },
        { threshold: 32, points: 8.5 },
        { threshold: 31, points: 8.0 },
        { threshold: 30, points: 7.5 },
        { threshold: 29, points: 7.0 },
        { threshold: 28, points: 6.5 },
        { threshold: 27, points: 6.0 },
        { threshold: 26, points: 5.5 },
        { threshold: 25, points: 5.0 },
        { threshold: 24, points: 4.5 },
        { threshold: 23, points: 4.0 },
        { threshold: 22, points: 3.5 },
        { threshold: 21, points: 3.0 },
        { threshold: 20, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 54, points: 15.0 },
        { threshold: 53, points: 14.5 },
        { threshold: 52, points: 14.0 },
        { threshold: 51, points: 13.5 },
        { threshold: 50, points: 13.0 },
        { threshold: 49, points: 12.5 },
        { threshold: 48, points: 12.0 },
        { threshold: 47, points: 11.5 },
        { threshold: 46, points: 11.0 },
        { threshold: 45, points: 10.5 },
        { threshold: 44, points: 10.0 },
        { threshold: 43, points: 9.5 },
        { threshold: 42, points: 9.0 },
        { threshold: 41, points: 8.5 },
        { threshold: 40, points: 8.0 },
        { threshold: 39, points: 7.5 },
        { threshold: 38, points: 7.0 },
        { threshold: 37, points: 6.5 },
        { threshold: 36, points: 6.0 },
        { threshold: 35, points: 5.5 },
        { threshold: 34, points: 5.0 },
        { threshold: 33, points: 4.5 },
        { threshold: 32, points: 4.0 },
        { threshold: 31, points: 3.5 },
        { threshold: 30, points: 3.0 },
        { threshold: 29, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 205, points: 15.0 },  // 3:25
        { threshold: 200, points: 14.5 },  // 3:20
        { threshold: 195, points: 14.0 },  // 3:15
        { threshold: 190, points: 13.5 },  // 3:10
        { threshold: 185, points: 13.0 },  // 3:05
        { threshold: 180, points: 12.5 },  // 3:00
        { threshold: 175, points: 12.0 },  // 2:55
        { threshold: 170, points: 11.5 },  // 2:50
        { threshold: 165, points: 11.0 },  // 2:45
        { threshold: 160, points: 10.5 },  // 2:40
        { threshold: 155, points: 10.0 },  // 2:35
        { threshold: 150, points: 9.5 },  // 2:30
        { threshold: 145, points: 9.0 },  // 2:25
        { threshold: 140, points: 8.5 },  // 2:20
        { threshold: 135, points: 8.0 },  // 2:15
        { threshold: 130, points: 7.5 },  // 2:10
        { threshold: 125, points: 7.0 },  // 2:05
        { threshold: 120, points: 6.5 },  // 2:00
        { threshold: 115, points: 6.0 },  // 1:55
        { threshold: 110, points: 5.5 },  // 1:50
        { threshold: 105, points: 5.0 },  // 1:45
        { threshold: 100, points: 4.5 },  // 1:40
        { threshold: 95, points: 4.0 },  // 1:35
        { threshold: 90, points: 3.5 },  // 1:30
        { threshold: 85, points: 3.0 },  // 1:25
        { threshold: 80, points: 2.5 },  // 1:20
      ],
    },
    // =====================================================================
    // FEMALE 35-39
    // =====================================================================
    [AGE_BRACKETS.AGE_35_39]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 972, points: 50.0 },  // 16:12
        { threshold: 1003, points: 49.5 },  // 16:43
        { threshold: 1034, points: 49.0 },  // 17:14
        { threshold: 1065, points: 48.0 },  // 17:45
        { threshold: 1096, points: 47.0 },  // 18:16
        { threshold: 1127, points: 46.0 },  // 18:47
        { threshold: 1157, points: 45.0 },  // 19:17
        { threshold: 1188, points: 44.0 },  // 19:48
        { threshold: 1219, points: 43.0 },  // 20:19
        { threshold: 1250, points: 42.0 },  // 20:50
        { threshold: 1281, points: 41.0 },  // 21:21
        { threshold: 1312, points: 40.0 },  // 21:52
        { threshold: 1343, points: 39.0 },  // 22:23
        { threshold: 1374, points: 38.5 },  // 22:54
        { threshold: 1405, points: 38.0 },  // 23:25
        { threshold: 1436, points: 37.5 },  // 23:56
        { threshold: 1466, points: 37.0 },  // 24:26
        { threshold: 1497, points: 36.5 },  // 24:57
        { threshold: 1528, points: 36.0 },  // 25:28
        { threshold: 1559, points: 35.5 },  // 25:59
        { threshold: 1590, points: 35.0 },  // 26:30
      ],
      [EXERCISES.HAMR]: [
        { threshold: 63, points: 50.0 },
        { threshold: 60, points: 49.5 },
        { threshold: 56, points: 49.0 },
        { threshold: 53, points: 48.0 },
        { threshold: 50, points: 47.0 },
        { threshold: 47, points: 46.0 },
        { threshold: 45, points: 45.0 },
        { threshold: 42, points: 44.0 },
        { threshold: 40, points: 43.0 },
        { threshold: 37, points: 42.0 },
        { threshold: 35, points: 41.0 },
        { threshold: 33, points: 40.0 },
        { threshold: 31, points: 39.0 },
        { threshold: 29, points: 38.5 },
        { threshold: 28, points: 38.0 },
        { threshold: 26, points: 37.5 },
        { threshold: 24, points: 37.0 },
        { threshold: 23, points: 36.5 },
        { threshold: 21, points: 36.0 },
        { threshold: 20, points: 35.5 },
        { threshold: 18, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.5 },
        { threshold: 40, points: 14.0 },
        { threshold: 38, points: 13.5 },
        { threshold: 37, points: 13.0 },
        { threshold: 36, points: 12.5 },
        { threshold: 35, points: 12.0 },
        { threshold: 33, points: 11.5 },
        { threshold: 32, points: 11.0 },
        { threshold: 31, points: 10.5 },
        { threshold: 30, points: 10.0 },
        { threshold: 28, points: 9.5 },
        { threshold: 27, points: 9.0 },
        { threshold: 26, points: 8.5 },
        { threshold: 25, points: 8.0 },
        { threshold: 23, points: 7.5 },
        { threshold: 22, points: 7.0 },
        { threshold: 21, points: 6.5 },
        { threshold: 20, points: 6.0 },
        { threshold: 18, points: 5.5 },
        { threshold: 17, points: 5.0 },
        { threshold: 16, points: 4.5 },
        { threshold: 15, points: 4.0 },
        { threshold: 13, points: 3.5 },
        { threshold: 12, points: 3.0 },
        { threshold: 11, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 36, points: 15.0 },
        { threshold: 35, points: 14.5 },
        { threshold: 34, points: 14.0 },
        { threshold: 33, points: 13.5 },
        { threshold: 32, points: 13.0 },
        { threshold: 31, points: 12.5 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.5 },
        { threshold: 28, points: 11.0 },
        { threshold: 27, points: 10.5 },
        { threshold: 26, points: 10.0 },
        { threshold: 25, points: 9.5 },
        { threshold: 24, points: 9.0 },
        { threshold: 23, points: 8.5 },
        { threshold: 22, points: 8.0 },
        { threshold: 21, points: 7.5 },
        { threshold: 20, points: 7.0 },
        { threshold: 19, points: 6.5 },
        { threshold: 18, points: 6.0 },
        { threshold: 17, points: 5.5 },
        { threshold: 16, points: 5.0 },
        { threshold: 15, points: 4.5 },
        { threshold: 14, points: 4.0 },
        { threshold: 13, points: 3.5 },
        { threshold: 12, points: 3.0 },
        { threshold: 11, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 43, points: 15.0 },
        { threshold: 42, points: 14.5 },
        { threshold: 41, points: 14.0 },
        { threshold: 40, points: 13.5 },
        { threshold: 39, points: 13.0 },
        { threshold: 38, points: 12.5 },
        { threshold: 37, points: 12.0 },
        { threshold: 36, points: 11.5 },
        { threshold: 35, points: 11.0 },
        { threshold: 34, points: 10.5 },
        { threshold: 33, points: 10.0 },
        { threshold: 32, points: 9.5 },
        { threshold: 31, points: 9.0 },
        { threshold: 30, points: 8.5 },
        { threshold: 29, points: 8.0 },
        { threshold: 28, points: 7.5 },
        { threshold: 27, points: 7.0 },
        { threshold: 26, points: 6.5 },
        { threshold: 25, points: 6.0 },
        { threshold: 24, points: 5.5 },
        { threshold: 23, points: 5.0 },
        { threshold: 22, points: 4.5 },
        { threshold: 21, points: 4.0 },
        { threshold: 20, points: 3.5 },
        { threshold: 19, points: 3.0 },
        { threshold: 18, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 52, points: 15.0 },
        { threshold: 51, points: 14.5 },
        { threshold: 50, points: 14.0 },
        { threshold: 49, points: 13.5 },
        { threshold: 48, points: 13.0 },
        { threshold: 47, points: 12.5 },
        { threshold: 46, points: 12.0 },
        { threshold: 45, points: 11.5 },
        { threshold: 44, points: 11.0 },
        { threshold: 43, points: 10.5 },
        { threshold: 42, points: 10.0 },
        { threshold: 41, points: 9.5 },
        { threshold: 40, points: 9.0 },
        { threshold: 39, points: 8.5 },
        { threshold: 38, points: 8.0 },
        { threshold: 37, points: 7.5 },
        { threshold: 36, points: 7.0 },
        { threshold: 35, points: 6.5 },
        { threshold: 34, points: 6.0 },
        { threshold: 33, points: 5.5 },
        { threshold: 32, points: 5.0 },
        { threshold: 31, points: 4.5 },
        { threshold: 30, points: 4.0 },
        { threshold: 29, points: 3.5 },
        { threshold: 28, points: 3.0 },
        { threshold: 27, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 200, points: 15.0 },  // 3:20
        { threshold: 195, points: 14.5 },  // 3:15
        { threshold: 190, points: 14.0 },  // 3:10
        { threshold: 185, points: 13.5 },  // 3:05
        { threshold: 180, points: 13.0 },  // 3:00
        { threshold: 175, points: 12.5 },  // 2:55
        { threshold: 170, points: 12.0 },  // 2:50
        { threshold: 165, points: 11.5 },  // 2:45
        { threshold: 160, points: 11.0 },  // 2:40
        { threshold: 155, points: 10.5 },  // 2:35
        { threshold: 150, points: 10.0 },  // 2:30
        { threshold: 145, points: 9.5 },  // 2:25
        { threshold: 140, points: 9.0 },  // 2:20
        { threshold: 135, points: 8.5 },  // 2:15
        { threshold: 130, points: 8.0 },  // 2:10
        { threshold: 125, points: 7.5 },  // 2:05
        { threshold: 120, points: 7.0 },  // 2:00
        { threshold: 115, points: 6.5 },  // 1:55
        { threshold: 110, points: 6.0 },  // 1:50
        { threshold: 105, points: 5.5 },  // 1:45
        { threshold: 100, points: 5.0 },  // 1:40
        { threshold: 95, points: 4.5 },  // 1:35
        { threshold: 90, points: 4.0 },  // 1:30
        { threshold: 85, points: 3.5 },  // 1:25
        { threshold: 80, points: 3.0 },  // 1:20
        { threshold: 75, points: 2.5 },  // 1:15
      ],
    },
    // =====================================================================
    // FEMALE 40-44
    // =====================================================================
    [AGE_BRACKETS.AGE_40_44]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1005, points: 50.0 },  // 16:45
        { threshold: 1035, points: 49.5 },  // 17:15
        { threshold: 1066, points: 49.0 },  // 17:46
        { threshold: 1096, points: 48.0 },  // 18:16
        { threshold: 1126, points: 47.0 },  // 18:46
        { threshold: 1157, points: 46.0 },  // 19:17
        { threshold: 1187, points: 45.0 },  // 19:47
        { threshold: 1217, points: 44.0 },  // 20:17
        { threshold: 1248, points: 43.0 },  // 20:48
        { threshold: 1278, points: 42.0 },  // 21:18
        { threshold: 1309, points: 41.0 },  // 21:49
        { threshold: 1339, points: 40.0 },  // 22:19
        { threshold: 1369, points: 39.0 },  // 22:49
        { threshold: 1400, points: 38.5 },  // 23:20
        { threshold: 1430, points: 38.0 },  // 23:50
        { threshold: 1460, points: 37.5 },  // 24:20
        { threshold: 1491, points: 37.0 },  // 24:51
        { threshold: 1521, points: 36.5 },  // 25:21
        { threshold: 1551, points: 36.0 },  // 25:51
        { threshold: 1582, points: 35.5 },  // 26:22
        { threshold: 1612, points: 35.0 },  // 26:52
      ],
      [EXERCISES.HAMR]: [
        { threshold: 59, points: 50.0 },
        { threshold: 56, points: 49.5 },
        { threshold: 53, points: 49.0 },
        { threshold: 50, points: 48.0 },
        { threshold: 47, points: 47.0 },
        { threshold: 45, points: 46.0 },
        { threshold: 42, points: 45.0 },
        { threshold: 40, points: 44.0 },
        { threshold: 38, points: 43.0 },
        { threshold: 35, points: 42.0 },
        { threshold: 33, points: 41.0 },
        { threshold: 31, points: 40.0 },
        { threshold: 30, points: 39.0 },
        { threshold: 28, points: 38.5 },
        { threshold: 26, points: 38.0 },
        { threshold: 24, points: 37.5 },
        { threshold: 23, points: 37.0 },
        { threshold: 21, points: 36.5 },
        { threshold: 20, points: 36.0 },
        { threshold: 19, points: 35.5 },
        { threshold: 17, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 39, points: 15.0 },
        { threshold: 38, points: 14.5 },
        { threshold: 37, points: 14.0 },
        { threshold: 36, points: 13.5 },
        { threshold: 35, points: 13.0 },
        { threshold: 33, points: 12.5 },
        { threshold: 32, points: 12.0 },
        { threshold: 31, points: 11.5 },
        { threshold: 30, points: 11.0 },
        { threshold: 29, points: 10.5 },
        { threshold: 27, points: 10.0 },
        { threshold: 26, points: 9.5 },
        { threshold: 25, points: 9.0 },
        { threshold: 24, points: 8.5 },
        { threshold: 23, points: 8.0 },
        { threshold: 21, points: 7.5 },
        { threshold: 20, points: 7.0 },
        { threshold: 19, points: 6.5 },
        { threshold: 18, points: 6.0 },
        { threshold: 17, points: 5.5 },
        { threshold: 15, points: 5.0 },
        { threshold: 14, points: 4.5 },
        { threshold: 13, points: 4.0 },
        { threshold: 12, points: 3.5 },
        { threshold: 11, points: 3.0 },
        { threshold: 10, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 34, points: 15.0 },
        { threshold: 33, points: 14.5 },
        { threshold: 32, points: 14.0 },
        { threshold: 31, points: 13.5 },
        { threshold: 30, points: 13.0 },
        { threshold: 29, points: 12.5 },
        { threshold: 28, points: 12.0 },
        { threshold: 27, points: 11.5 },
        { threshold: 26, points: 11.0 },
        { threshold: 25, points: 10.5 },
        { threshold: 24, points: 10.0 },
        { threshold: 23, points: 9.5 },
        { threshold: 22, points: 9.0 },
        { threshold: 21, points: 8.5 },
        { threshold: 20, points: 8.0 },
        { threshold: 19, points: 7.5 },
        { threshold: 18, points: 7.0 },
        { threshold: 17, points: 6.5 },
        { threshold: 16, points: 6.0 },
        { threshold: 15, points: 5.5 },
        { threshold: 14, points: 5.0 },
        { threshold: 13, points: 4.5 },
        { threshold: 12, points: 4.0 },
        { threshold: 11, points: 3.5 },
        { threshold: 10, points: 3.0 },
        { threshold: 9, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 41, points: 15.0 },
        { threshold: 40, points: 14.5 },
        { threshold: 39, points: 14.0 },
        { threshold: 38, points: 13.5 },
        { threshold: 37, points: 13.0 },
        { threshold: 36, points: 12.5 },
        { threshold: 35, points: 12.0 },
        { threshold: 34, points: 11.5 },
        { threshold: 33, points: 11.0 },
        { threshold: 32, points: 10.5 },
        { threshold: 31, points: 10.0 },
        { threshold: 30, points: 9.5 },
        { threshold: 29, points: 9.0 },
        { threshold: 28, points: 8.5 },
        { threshold: 27, points: 8.0 },
        { threshold: 26, points: 7.5 },
        { threshold: 25, points: 7.0 },
        { threshold: 24, points: 6.5 },
        { threshold: 23, points: 6.0 },
        { threshold: 22, points: 5.5 },
        { threshold: 21, points: 5.0 },
        { threshold: 20, points: 4.5 },
        { threshold: 19, points: 4.0 },
        { threshold: 18, points: 3.5 },
        { threshold: 17, points: 3.0 },
        { threshold: 16, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 50, points: 15.0 },
        { threshold: 49, points: 14.5 },
        { threshold: 48, points: 14.0 },
        { threshold: 47, points: 13.5 },
        { threshold: 46, points: 13.0 },
        { threshold: 45, points: 12.5 },
        { threshold: 44, points: 12.0 },
        { threshold: 43, points: 11.5 },
        { threshold: 42, points: 11.0 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 10.0 },
        { threshold: 39, points: 9.5 },
        { threshold: 38, points: 9.0 },
        { threshold: 37, points: 8.5 },
        { threshold: 36, points: 8.0 },
        { threshold: 35, points: 7.5 },
        { threshold: 34, points: 7.0 },
        { threshold: 33, points: 6.5 },
        { threshold: 32, points: 6.0 },
        { threshold: 31, points: 5.5 },
        { threshold: 30, points: 5.0 },
        { threshold: 29, points: 4.5 },
        { threshold: 28, points: 4.0 },
        { threshold: 27, points: 3.5 },
        { threshold: 26, points: 3.0 },
        { threshold: 25, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 195, points: 15.0 },  // 3:15
        { threshold: 190, points: 14.5 },  // 3:10
        { threshold: 185, points: 14.0 },  // 3:05
        { threshold: 180, points: 13.5 },  // 3:00
        { threshold: 175, points: 13.0 },  // 2:55
        { threshold: 170, points: 12.5 },  // 2:50
        { threshold: 165, points: 12.0 },  // 2:45
        { threshold: 160, points: 11.5 },  // 2:40
        { threshold: 155, points: 11.0 },  // 2:35
        { threshold: 150, points: 10.5 },  // 2:30
        { threshold: 145, points: 10.0 },  // 2:25
        { threshold: 140, points: 9.5 },  // 2:20
        { threshold: 135, points: 9.0 },  // 2:15
        { threshold: 130, points: 8.5 },  // 2:10
        { threshold: 125, points: 8.0 },  // 2:05
        { threshold: 120, points: 7.5 },  // 2:00
        { threshold: 115, points: 7.0 },  // 1:55
        { threshold: 110, points: 6.5 },  // 1:50
        { threshold: 105, points: 6.0 },  // 1:45
        { threshold: 100, points: 5.5 },  // 1:40
        { threshold: 95, points: 5.0 },  // 1:35
        { threshold: 90, points: 4.5 },  // 1:30
        { threshold: 85, points: 4.0 },  // 1:25
        { threshold: 80, points: 3.5 },  // 1:20
        { threshold: 75, points: 3.0 },  // 1:15
        { threshold: 70, points: 2.5 },  // 1:10
      ],
    },
    // =====================================================================
    // FEMALE 45-49
    // =====================================================================
    [AGE_BRACKETS.AGE_45_49]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1015, points: 50.0 },  // 16:55
        { threshold: 1046, points: 49.5 },  // 17:26
        { threshold: 1077, points: 49.0 },  // 17:57
        { threshold: 1108, points: 48.0 },  // 18:28
        { threshold: 1139, points: 47.0 },  // 18:59
        { threshold: 1170, points: 46.0 },  // 19:30
        { threshold: 1201, points: 45.0 },  // 20:01
        { threshold: 1232, points: 44.0 },  // 20:32
        { threshold: 1263, points: 43.0 },  // 21:03
        { threshold: 1294, points: 42.0 },  // 21:34
        { threshold: 1325, points: 41.0 },  // 22:05
        { threshold: 1356, points: 40.0 },  // 22:36
        { threshold: 1387, points: 39.0 },  // 23:07
        { threshold: 1418, points: 38.5 },  // 23:38
        { threshold: 1449, points: 38.0 },  // 24:09
        { threshold: 1480, points: 37.5 },  // 24:40
        { threshold: 1511, points: 37.0 },  // 25:11
        { threshold: 1542, points: 36.5 },  // 25:42
        { threshold: 1573, points: 36.0 },  // 26:13
        { threshold: 1604, points: 35.5 },  // 26:44
        { threshold: 1635, points: 35.0 },  // 27:15
      ],
      [EXERCISES.HAMR]: [
        { threshold: 58, points: 50.0 },
        { threshold: 55, points: 49.5 },
        { threshold: 52, points: 49.0 },
        { threshold: 49, points: 48.0 },
        { threshold: 46, points: 47.0 },
        { threshold: 44, points: 46.0 },
        { threshold: 41, points: 45.0 },
        { threshold: 39, points: 44.0 },
        { threshold: 37, points: 43.0 },
        { threshold: 34, points: 42.0 },
        { threshold: 32, points: 41.0 },
        { threshold: 30, points: 40.0 },
        { threshold: 29, points: 39.0 },
        { threshold: 27, points: 38.5 },
        { threshold: 25, points: 38.0 },
        { threshold: 23, points: 37.5 },
        { threshold: 22, points: 37.0 },
        { threshold: 20, points: 36.5 },
        { threshold: 19, points: 36.0 },
        { threshold: 18, points: 35.5 },
        { threshold: 16, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 36, points: 15.0 },
        { threshold: 35, points: 14.5 },
        { threshold: 34, points: 14.0 },
        { threshold: 33, points: 13.5 },
        { threshold: 32, points: 13.0 },
        { threshold: 30, points: 12.5 },
        { threshold: 29, points: 12.0 },
        { threshold: 28, points: 11.5 },
        { threshold: 27, points: 11.0 },
        { threshold: 26, points: 10.5 },
        { threshold: 25, points: 10.0 },
        { threshold: 24, points: 9.5 },
        { threshold: 23, points: 9.0 },
        { threshold: 21, points: 8.5 },
        { threshold: 20, points: 8.0 },
        { threshold: 19, points: 7.5 },
        { threshold: 18, points: 7.0 },
        { threshold: 17, points: 6.5 },
        { threshold: 16, points: 6.0 },
        { threshold: 15, points: 5.5 },
        { threshold: 14, points: 5.0 },
        { threshold: 12, points: 4.5 },
        { threshold: 11, points: 4.0 },
        { threshold: 10, points: 3.5 },
        { threshold: 9, points: 3.0 },
        { threshold: 8, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 32, points: 15.0 },
        { threshold: 31, points: 14.5 },
        { threshold: 30, points: 14.0 },
        { threshold: 29, points: 13.5 },
        { threshold: 28, points: 13.0 },
        { threshold: 27, points: 12.5 },
        { threshold: 26, points: 12.0 },
        { threshold: 25, points: 11.5 },
        { threshold: 24, points: 11.0 },
        { threshold: 23, points: 10.5 },
        { threshold: 22, points: 10.0 },
        { threshold: 21, points: 9.5 },
        { threshold: 20, points: 9.0 },
        { threshold: 19, points: 8.5 },
        { threshold: 18, points: 8.0 },
        { threshold: 17, points: 7.5 },
        { threshold: 16, points: 7.0 },
        { threshold: 15, points: 6.5 },
        { threshold: 14, points: 6.0 },
        { threshold: 13, points: 5.5 },
        { threshold: 12, points: 5.0 },
        { threshold: 11, points: 4.5 },
        { threshold: 10, points: 4.0 },
        { threshold: 9, points: 3.5 },
        { threshold: 8, points: 3.0 },
        { threshold: 7, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 35, points: 15.0 },
        { threshold: 34, points: 14.5 },
        { threshold: 33, points: 14.0 },
        { threshold: 32, points: 13.5 },
        { threshold: 31, points: 13.0 },
        { threshold: 30, points: 12.5 },
        { threshold: 29, points: 12.0 },
        { threshold: 28, points: 11.5 },
        { threshold: 27, points: 11.0 },
        { threshold: 26, points: 10.5 },
        { threshold: 25, points: 10.0 },
        { threshold: 24, points: 9.5 },
        { threshold: 23, points: 9.0 },
        { threshold: 22, points: 8.5 },
        { threshold: 21, points: 8.0 },
        { threshold: 20, points: 7.5 },
        { threshold: 19, points: 7.0 },
        { threshold: 18, points: 6.5 },
        { threshold: 17, points: 6.0 },
        { threshold: 16, points: 5.5 },
        { threshold: 15, points: 5.0 },
        { threshold: 14, points: 4.5 },
        { threshold: 13, points: 4.0 },
        { threshold: 12, points: 3.5 },
        { threshold: 11, points: 3.0 },
        { threshold: 10, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 48, points: 15.0 },
        { threshold: 47, points: 14.5 },
        { threshold: 46, points: 14.0 },
        { threshold: 45, points: 13.5 },
        { threshold: 44, points: 13.0 },
        { threshold: 43, points: 12.5 },
        { threshold: 42, points: 12.0 },
        { threshold: 41, points: 11.5 },
        { threshold: 40, points: 11.0 },
        { threshold: 39, points: 10.5 },
        { threshold: 38, points: 10.0 },
        { threshold: 37, points: 9.5 },
        { threshold: 36, points: 9.0 },
        { threshold: 35, points: 8.5 },
        { threshold: 34, points: 8.0 },
        { threshold: 33, points: 7.5 },
        { threshold: 32, points: 7.0 },
        { threshold: 31, points: 6.5 },
        { threshold: 30, points: 6.0 },
        { threshold: 29, points: 5.5 },
        { threshold: 28, points: 5.0 },
        { threshold: 27, points: 4.5 },
        { threshold: 26, points: 4.0 },
        { threshold: 25, points: 3.5 },
        { threshold: 24, points: 3.0 },
        { threshold: 23, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 190, points: 15.0 },  // 3:10
        { threshold: 185, points: 14.5 },  // 3:05
        { threshold: 180, points: 14.0 },  // 3:00
        { threshold: 175, points: 13.5 },  // 2:55
        { threshold: 170, points: 13.0 },  // 2:50
        { threshold: 165, points: 12.5 },  // 2:45
        { threshold: 160, points: 12.0 },  // 2:40
        { threshold: 155, points: 11.5 },  // 2:35
        { threshold: 150, points: 11.0 },  // 2:30
        { threshold: 145, points: 10.5 },  // 2:25
        { threshold: 140, points: 10.0 },  // 2:20
        { threshold: 135, points: 9.5 },  // 2:15
        { threshold: 130, points: 9.0 },  // 2:10
        { threshold: 125, points: 8.5 },  // 2:05
        { threshold: 120, points: 8.0 },  // 2:00
        { threshold: 115, points: 7.5 },  // 1:55
        { threshold: 110, points: 7.0 },  // 1:50
        { threshold: 105, points: 6.5 },  // 1:45
        { threshold: 100, points: 6.0 },  // 1:40
        { threshold: 95, points: 5.5 },  // 1:35
        { threshold: 90, points: 5.0 },  // 1:30
        { threshold: 85, points: 4.5 },  // 1:25
        { threshold: 80, points: 4.0 },  // 1:20
        { threshold: 75, points: 3.5 },  // 1:15
        { threshold: 70, points: 3.0 },  // 1:10
        { threshold: 65, points: 2.5 },  // 1:05
      ],
    },
    // =====================================================================
    // FEMALE 50-54
    // =====================================================================
    [AGE_BRACKETS.AGE_50_54]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1030, points: 50.0 },  // 17:10
        { threshold: 1063, points: 49.5 },  // 17:43
        { threshold: 1096, points: 49.0 },  // 18:16
        { threshold: 1128, points: 48.0 },  // 18:48
        { threshold: 1161, points: 47.0 },  // 19:21
        { threshold: 1194, points: 46.0 },  // 19:54
        { threshold: 1227, points: 45.0 },  // 20:27
        { threshold: 1259, points: 44.0 },  // 20:59
        { threshold: 1292, points: 43.0 },  // 21:32
        { threshold: 1325, points: 42.0 },  // 22:05
        { threshold: 1358, points: 41.0 },  // 22:38
        { threshold: 1390, points: 40.0 },  // 23:10
        { threshold: 1423, points: 39.0 },  // 23:43
        { threshold: 1456, points: 38.5 },  // 24:16
        { threshold: 1489, points: 38.0 },  // 24:49
        { threshold: 1521, points: 37.5 },  // 25:21
        { threshold: 1554, points: 37.0 },  // 25:54
        { threshold: 1587, points: 36.5 },  // 26:27
        { threshold: 1620, points: 36.0 },  // 27:00
        { threshold: 1652, points: 35.5 },  // 27:32
        { threshold: 1685, points: 35.0 },  // 28:05
      ],
      [EXERCISES.HAMR]: [
        { threshold: 57, points: 50.0 },
        { threshold: 53, points: 49.5 },
        { threshold: 50, points: 49.0 },
        { threshold: 47, points: 48.0 },
        { threshold: 44, points: 47.0 },
        { threshold: 42, points: 46.0 },
        { threshold: 39, points: 45.0 },
        { threshold: 37, points: 44.0 },
        { threshold: 35, points: 43.0 },
        { threshold: 32, points: 42.0 },
        { threshold: 30, points: 41.0 },
        { threshold: 28, points: 40.0 },
        { threshold: 26, points: 39.0 },
        { threshold: 25, points: 38.5 },
        { threshold: 23, points: 38.0 },
        { threshold: 21, points: 37.5 },
        { threshold: 20, points: 37.0 },
        { threshold: 18, points: 36.5 },
        { threshold: 17, points: 36.0 },
        { threshold: 16, points: 35.5 },
        { threshold: 14, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 34, points: 15.0 },
        { threshold: 33, points: 14.5 },
        { threshold: 32, points: 14.0 },
        { threshold: 31, points: 13.5 },
        { threshold: 30, points: 13.0 },
        { threshold: 29, points: 12.5 },
        { threshold: 28, points: 12.0 },
        { threshold: 26, points: 11.5 },
        { threshold: 25, points: 11.0 },
        { threshold: 24, points: 10.5 },
        { threshold: 23, points: 10.0 },
        { threshold: 22, points: 9.5 },
        { threshold: 21, points: 9.0 },
        { threshold: 20, points: 8.5 },
        { threshold: 19, points: 8.0 },
        { threshold: 18, points: 7.5 },
        { threshold: 17, points: 7.0 },
        { threshold: 16, points: 6.5 },
        { threshold: 15, points: 6.0 },
        { threshold: 13, points: 5.5 },
        { threshold: 12, points: 5.0 },
        { threshold: 11, points: 4.5 },
        { threshold: 10, points: 4.0 },
        { threshold: 9, points: 3.5 },
        { threshold: 8, points: 3.0 },
        { threshold: 7, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 30, points: 15.0 },
        { threshold: 29, points: 14.5 },
        { threshold: 28, points: 14.0 },
        { threshold: 27, points: 13.5 },
        { threshold: 26, points: 13.0 },
        { threshold: 25, points: 12.5 },
        { threshold: 24, points: 12.0 },
        { threshold: 23, points: 11.5 },
        { threshold: 22, points: 11.0 },
        { threshold: 21, points: 10.5 },
        { threshold: 20, points: 10.0 },
        { threshold: 19, points: 9.5 },
        { threshold: 18, points: 9.0 },
        { threshold: 17, points: 8.5 },
        { threshold: 16, points: 8.0 },
        { threshold: 15, points: 7.5 },
        { threshold: 14, points: 7.0 },
        { threshold: 13, points: 6.5 },
        { threshold: 12, points: 6.0 },
        { threshold: 11, points: 5.5 },
        { threshold: 10, points: 5.0 },
        { threshold: 9, points: 4.5 },
        { threshold: 8, points: 4.0 },
        { threshold: 7, points: 3.5 },
        { threshold: 6, points: 3.0 },
        { threshold: 5, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 34, points: 15.0 },
        { threshold: 33, points: 14.5 },
        { threshold: 32, points: 14.0 },
        { threshold: 31, points: 13.5 },
        { threshold: 30, points: 13.0 },
        { threshold: 29, points: 12.5 },
        { threshold: 28, points: 12.0 },
        { threshold: 27, points: 11.5 },
        { threshold: 26, points: 11.0 },
        { threshold: 25, points: 10.5 },
        { threshold: 24, points: 10.0 },
        { threshold: 23, points: 9.5 },
        { threshold: 22, points: 9.0 },
        { threshold: 21, points: 8.5 },
        { threshold: 20, points: 8.0 },
        { threshold: 19, points: 7.5 },
        { threshold: 18, points: 7.0 },
        { threshold: 17, points: 6.5 },
        { threshold: 16, points: 6.0 },
        { threshold: 15, points: 5.5 },
        { threshold: 14, points: 5.0 },
        { threshold: 13, points: 4.5 },
        { threshold: 12, points: 4.0 },
        { threshold: 11, points: 3.5 },
        { threshold: 10, points: 3.0 },
        { threshold: 9, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 46, points: 15.0 },
        { threshold: 45, points: 14.5 },
        { threshold: 44, points: 14.0 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.0 },
        { threshold: 41, points: 12.5 },
        { threshold: 40, points: 12.0 },
        { threshold: 39, points: 11.5 },
        { threshold: 38, points: 11.0 },
        { threshold: 37, points: 10.5 },
        { threshold: 36, points: 10.0 },
        { threshold: 35, points: 9.5 },
        { threshold: 34, points: 9.0 },
        { threshold: 33, points: 8.5 },
        { threshold: 32, points: 8.0 },
        { threshold: 31, points: 7.5 },
        { threshold: 30, points: 7.0 },
        { threshold: 29, points: 6.5 },
        { threshold: 28, points: 6.0 },
        { threshold: 27, points: 5.5 },
        { threshold: 26, points: 5.0 },
        { threshold: 25, points: 4.5 },
        { threshold: 24, points: 4.0 },
        { threshold: 23, points: 3.5 },
        { threshold: 22, points: 3.0 },
        { threshold: 21, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 185, points: 15.0 },  // 3:05
        { threshold: 180, points: 14.5 },  // 3:00
        { threshold: 175, points: 14.0 },  // 2:55
        { threshold: 170, points: 13.5 },  // 2:50
        { threshold: 165, points: 13.0 },  // 2:45
        { threshold: 160, points: 12.5 },  // 2:40
        { threshold: 155, points: 12.0 },  // 2:35
        { threshold: 150, points: 11.5 },  // 2:30
        { threshold: 145, points: 11.0 },  // 2:25
        { threshold: 140, points: 10.5 },  // 2:20
        { threshold: 135, points: 10.0 },  // 2:15
        { threshold: 130, points: 9.5 },  // 2:10
        { threshold: 125, points: 9.0 },  // 2:05
        { threshold: 120, points: 8.5 },  // 2:00
        { threshold: 115, points: 8.0 },  // 1:55
        { threshold: 110, points: 7.5 },  // 1:50
        { threshold: 105, points: 7.0 },  // 1:45
        { threshold: 100, points: 6.5 },  // 1:40
        { threshold: 95, points: 6.0 },  // 1:35
        { threshold: 90, points: 5.5 },  // 1:30
        { threshold: 85, points: 5.0 },  // 1:25
        { threshold: 80, points: 4.5 },  // 1:20
        { threshold: 75, points: 4.0 },  // 1:15
        { threshold: 70, points: 3.5 },  // 1:10
        { threshold: 65, points: 3.0 },  // 1:05
        { threshold: 60, points: 2.5 },  // 1:00
      ],
    },
    // =====================================================================
    // FEMALE 55-59
    // =====================================================================
    [AGE_BRACKETS.AGE_55_59]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1063, points: 50.0 },  // 17:43
        { threshold: 1096, points: 49.5 },  // 18:16
        { threshold: 1129, points: 49.0 },  // 18:49
        { threshold: 1162, points: 48.0 },  // 19:22
        { threshold: 1194, points: 47.0 },  // 19:54
        { threshold: 1227, points: 46.0 },  // 20:27
        { threshold: 1260, points: 45.0 },  // 21:00
        { threshold: 1293, points: 44.0 },  // 21:33
        { threshold: 1326, points: 43.0 },  // 22:06
        { threshold: 1359, points: 42.0 },  // 22:39
        { threshold: 1392, points: 41.0 },  // 23:12
        { threshold: 1424, points: 40.0 },  // 23:44
        { threshold: 1457, points: 39.0 },  // 24:17
        { threshold: 1490, points: 38.5 },  // 24:50
        { threshold: 1523, points: 38.0 },  // 25:23
        { threshold: 1556, points: 37.5 },  // 25:56
        { threshold: 1589, points: 37.0 },  // 26:29
        { threshold: 1621, points: 36.5 },  // 27:01
        { threshold: 1654, points: 36.0 },  // 27:34
        { threshold: 1687, points: 35.5 },  // 28:07
        { threshold: 1720, points: 35.0 },  // 28:40
      ],
      [EXERCISES.HAMR]: [
        { threshold: 53, points: 50.0 },
        { threshold: 50, points: 49.5 },
        { threshold: 47, points: 49.0 },
        { threshold: 44, points: 48.0 },
        { threshold: 42, points: 47.0 },
        { threshold: 39, points: 46.0 },
        { threshold: 37, points: 45.0 },
        { threshold: 34, points: 44.0 },
        { threshold: 32, points: 43.0 },
        { threshold: 30, points: 42.0 },
        { threshold: 28, points: 41.0 },
        { threshold: 26, points: 40.0 },
        { threshold: 25, points: 39.0 },
        { threshold: 23, points: 38.5 },
        { threshold: 21, points: 38.0 },
        { threshold: 20, points: 37.5 },
        { threshold: 18, points: 37.0 },
        { threshold: 17, points: 36.5 },
        { threshold: 15, points: 36.0 },
        { threshold: 14, points: 35.5 },
        { threshold: 13, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 31, points: 15.0 },
        { threshold: 30, points: 14.5 },
        { threshold: 29, points: 14.0 },
        { threshold: 28, points: 13.5 },
        { threshold: 27, points: 13.0 },
        { threshold: 26, points: 12.5 },
        { threshold: 25, points: 12.0 },
        { threshold: 24, points: 11.5 },
        { threshold: 23, points: 11.0 },
        { threshold: 22, points: 10.5 },
        { threshold: 21, points: 10.0 },
        { threshold: 20, points: 9.5 },
        { threshold: 19, points: 9.0 },
        { threshold: 17, points: 8.5 },
        { threshold: 16, points: 8.0 },
        { threshold: 15, points: 7.5 },
        { threshold: 14, points: 7.0 },
        { threshold: 13, points: 6.5 },
        { threshold: 12, points: 6.0 },
        { threshold: 11, points: 5.5 },
        { threshold: 10, points: 5.0 },
        { threshold: 9, points: 4.5 },
        { threshold: 8, points: 4.0 },
        { threshold: 7, points: 3.5 },
        { threshold: 6, points: 3.0 },
        { threshold: 5, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 28, points: 15.0 },
        { threshold: 27, points: 14.5 },
        { threshold: 26, points: 14.0 },
        { threshold: 25, points: 13.5 },
        { threshold: 24, points: 13.0 },
        { threshold: 23, points: 12.5 },
        { threshold: 22, points: 12.0 },
        { threshold: 21, points: 11.5 },
        { threshold: 20, points: 11.0 },
        { threshold: 19, points: 10.5 },
        { threshold: 18, points: 10.0 },
        { threshold: 17, points: 9.5 },
        { threshold: 16, points: 9.0 },
        { threshold: 15, points: 8.5 },
        { threshold: 14, points: 8.0 },
        { threshold: 13, points: 7.5 },
        { threshold: 12, points: 7.0 },
        { threshold: 11, points: 6.5 },
        { threshold: 10, points: 6.0 },
        { threshold: 9, points: 5.5 },
        { threshold: 8, points: 5.0 },
        { threshold: 7, points: 4.5 },
        { threshold: 6, points: 4.0 },
        { threshold: 5, points: 3.5 },
        { threshold: 4, points: 3.0 },
        { threshold: 3, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 32, points: 15.0 },
        { threshold: 31, points: 14.5 },
        { threshold: 30, points: 14.0 },
        { threshold: 29, points: 13.5 },
        { threshold: 28, points: 13.0 },
        { threshold: 27, points: 12.5 },
        { threshold: 26, points: 12.0 },
        { threshold: 25, points: 11.5 },
        { threshold: 24, points: 11.0 },
        { threshold: 23, points: 10.5 },
        { threshold: 22, points: 10.0 },
        { threshold: 21, points: 9.5 },
        { threshold: 20, points: 9.0 },
        { threshold: 19, points: 8.5 },
        { threshold: 18, points: 8.0 },
        { threshold: 17, points: 7.5 },
        { threshold: 16, points: 7.0 },
        { threshold: 15, points: 6.5 },
        { threshold: 14, points: 6.0 },
        { threshold: 13, points: 5.5 },
        { threshold: 12, points: 5.0 },
        { threshold: 11, points: 4.5 },
        { threshold: 10, points: 4.0 },
        { threshold: 9, points: 3.5 },
        { threshold: 8, points: 3.0 },
        { threshold: 7, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.5 },
        { threshold: 42, points: 14.0 },
        { threshold: 41, points: 13.5 },
        { threshold: 40, points: 13.0 },
        { threshold: 39, points: 12.5 },
        { threshold: 38, points: 12.0 },
        { threshold: 37, points: 11.5 },
        { threshold: 36, points: 11.0 },
        { threshold: 35, points: 10.5 },
        { threshold: 34, points: 10.0 },
        { threshold: 33, points: 9.5 },
        { threshold: 32, points: 9.0 },
        { threshold: 31, points: 8.5 },
        { threshold: 30, points: 8.0 },
        { threshold: 29, points: 7.5 },
        { threshold: 28, points: 7.0 },
        { threshold: 27, points: 6.5 },
        { threshold: 26, points: 6.0 },
        { threshold: 25, points: 5.5 },
        { threshold: 24, points: 5.0 },
        { threshold: 23, points: 4.5 },
        { threshold: 22, points: 4.0 },
        { threshold: 21, points: 3.5 },
        { threshold: 20, points: 3.0 },
        { threshold: 19, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 180, points: 15.0 },  // 3:00
        { threshold: 175, points: 14.5 },  // 2:55
        { threshold: 170, points: 14.0 },  // 2:50
        { threshold: 165, points: 13.5 },  // 2:45
        { threshold: 160, points: 13.0 },  // 2:40
        { threshold: 155, points: 12.5 },  // 2:35
        { threshold: 150, points: 12.0 },  // 2:30
        { threshold: 145, points: 11.5 },  // 2:25
        { threshold: 140, points: 11.0 },  // 2:20
        { threshold: 135, points: 10.5 },  // 2:15
        { threshold: 130, points: 10.0 },  // 2:10
        { threshold: 125, points: 9.5 },  // 2:05
        { threshold: 120, points: 9.0 },  // 2:00
        { threshold: 115, points: 8.5 },  // 1:55
        { threshold: 110, points: 8.0 },  // 1:50
        { threshold: 105, points: 7.5 },  // 1:45
        { threshold: 100, points: 7.0 },  // 1:40
        { threshold: 95, points: 6.5 },  // 1:35
        { threshold: 90, points: 6.0 },  // 1:30
        { threshold: 85, points: 5.5 },  // 1:25
        { threshold: 80, points: 5.0 },  // 1:20
        { threshold: 75, points: 4.5 },  // 1:15
        { threshold: 70, points: 4.0 },  // 1:10
        { threshold: 65, points: 3.5 },  // 1:05
        { threshold: 60, points: 3.0 },  // 1:00
        { threshold: 55, points: 2.5 },  // 0:55
      ],
    },
    // =====================================================================
    // FEMALE 60+
    // =====================================================================
    [AGE_BRACKETS.AGE_60_PLUS]: {
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1100, points: 50.0 },  // 18:20
        { threshold: 1134, points: 49.5 },  // 18:54
        { threshold: 1168, points: 49.0 },  // 19:28
        { threshold: 1202, points: 48.0 },  // 20:02
        { threshold: 1236, points: 47.0 },  // 20:36
        { threshold: 1270, points: 46.0 },  // 21:10
        { threshold: 1304, points: 45.0 },  // 21:44
        { threshold: 1338, points: 44.0 },  // 22:18
        { threshold: 1372, points: 43.0 },  // 22:52
        { threshold: 1406, points: 42.0 },  // 23:26
        { threshold: 1440, points: 41.0 },  // 24:00
        { threshold: 1474, points: 40.0 },  // 24:34
        { threshold: 1508, points: 39.0 },  // 25:08
        { threshold: 1542, points: 38.5 },  // 25:42
        { threshold: 1576, points: 38.0 },  // 26:16
        { threshold: 1610, points: 37.5 },  // 26:50
        { threshold: 1644, points: 37.0 },  // 27:24
        { threshold: 1678, points: 36.5 },  // 27:58
        { threshold: 1712, points: 36.0 },  // 28:32
        { threshold: 1746, points: 35.5 },  // 29:06
        { threshold: 1780, points: 35.0 },  // 29:40
      ],
      [EXERCISES.HAMR]: [
        { threshold: 50, points: 50.0 },
        { threshold: 47, points: 49.5 },
        { threshold: 44, points: 49.0 },
        { threshold: 41, points: 48.0 },
        { threshold: 38, points: 47.0 },
        { threshold: 36, points: 46.0 },
        { threshold: 34, points: 45.0 },
        { threshold: 32, points: 44.0 },
        { threshold: 29, points: 43.0 },
        { threshold: 27, points: 42.0 },
        { threshold: 26, points: 41.0 },
        { threshold: 24, points: 40.0 },
        { threshold: 22, points: 39.0 },
        { threshold: 20, points: 38.5 },
        { threshold: 19, points: 38.0 },
        { threshold: 18, points: 37.5 },
        { threshold: 17, points: 37.0 },
        { threshold: 14, points: 36.5 },
        { threshold: 13, points: 36.0 },
        { threshold: 12, points: 35.5 },
        { threshold: 11, points: 35.0 },
      ],
      [EXERCISES.PUSHUPS]: [
        { threshold: 28, points: 15.0 },
        { threshold: 27, points: 14.5 },
        { threshold: 26, points: 14.0 },
        { threshold: 25, points: 13.5 },
        { threshold: 24, points: 13.0 },
        { threshold: 23, points: 12.5 },
        { threshold: 22, points: 12.0 },
        { threshold: 21, points: 11.5 },
        { threshold: 20, points: 11.0 },
        { threshold: 19, points: 10.5 },
        { threshold: 18, points: 10.0 },
        { threshold: 17, points: 9.5 },
        { threshold: 16, points: 9.0 },
        { threshold: 15, points: 8.5 },
        { threshold: 14, points: 8.0 },
        { threshold: 13, points: 7.5 },
        { threshold: 12, points: 7.0 },
        { threshold: 11, points: 6.5 },
        { threshold: 10, points: 6.0 },
        { threshold: 9, points: 5.5 },
        { threshold: 8, points: 5.0 },
        { threshold: 7, points: 4.5 },
        { threshold: 6, points: 4.0 },
        { threshold: 5, points: 3.5 },
        { threshold: 4, points: 3.0 },
        { threshold: 3, points: 2.5 },
      ],
      [EXERCISES.HRPU]: [
        { threshold: 26, points: 15.0 },
        { threshold: 25, points: 14.5 },
        { threshold: 24, points: 14.0 },
        { threshold: 23, points: 13.5 },
        { threshold: 22, points: 13.0 },
        { threshold: 21, points: 12.5 },
        { threshold: 20, points: 12.0 },
        { threshold: 19, points: 11.5 },
        { threshold: 18, points: 11.0 },
        { threshold: 17, points: 10.5 },
        { threshold: 16, points: 10.0 },
        { threshold: 15, points: 9.5 },
        { threshold: 14, points: 9.0 },
        { threshold: 13, points: 8.5 },
        { threshold: 12, points: 8.0 },
        { threshold: 11, points: 7.5 },
        { threshold: 10, points: 7.0 },
        { threshold: 9, points: 6.5 },
        { threshold: 8, points: 6.0 },
        { threshold: 7, points: 5.5 },
        { threshold: 6, points: 5.0 },
        { threshold: 5, points: 4.5 },
        { threshold: 4, points: 4.0 },
        { threshold: 3, points: 3.5 },
        { threshold: 2, points: 3.0 },
        { threshold: 1, points: 2.5 },
      ],
      [EXERCISES.SITUPS]: [
        { threshold: 31, points: 15.0 },
        { threshold: 30, points: 14.5 },
        { threshold: 29, points: 14.0 },
        { threshold: 28, points: 13.5 },
        { threshold: 27, points: 13.0 },
        { threshold: 26, points: 12.5 },
        { threshold: 25, points: 12.0 },
        { threshold: 24, points: 11.5 },
        { threshold: 23, points: 11.0 },
        { threshold: 22, points: 10.5 },
        { threshold: 21, points: 10.0 },
        { threshold: 20, points: 9.5 },
        { threshold: 19, points: 9.0 },
        { threshold: 18, points: 8.5 },
        { threshold: 17, points: 8.0 },
        { threshold: 16, points: 7.5 },
        { threshold: 15, points: 7.0 },
        { threshold: 14, points: 6.5 },
        { threshold: 13, points: 6.0 },
        { threshold: 12, points: 5.5 },
        { threshold: 11, points: 5.0 },
        { threshold: 10, points: 4.5 },
        { threshold: 9, points: 4.0 },
        { threshold: 8, points: 3.5 },
        { threshold: 7, points: 3.0 },
        { threshold: 6, points: 2.5 },
      ],
      [EXERCISES.CLRC]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.5 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.5 },
        { threshold: 38, points: 13.0 },
        { threshold: 37, points: 12.5 },
        { threshold: 36, points: 12.0 },
        { threshold: 35, points: 11.5 },
        { threshold: 34, points: 11.0 },
        { threshold: 33, points: 10.5 },
        { threshold: 32, points: 10.0 },
        { threshold: 31, points: 9.5 },
        { threshold: 30, points: 9.0 },
        { threshold: 29, points: 8.5 },
        { threshold: 28, points: 8.0 },
        { threshold: 27, points: 7.5 },
        { threshold: 26, points: 7.0 },
        { threshold: 25, points: 6.5 },
        { threshold: 24, points: 6.0 },
        { threshold: 23, points: 5.5 },
        { threshold: 22, points: 5.0 },
        { threshold: 21, points: 4.5 },
        { threshold: 20, points: 4.0 },
        { threshold: 19, points: 3.5 },
        { threshold: 18, points: 3.0 },
        { threshold: 17, points: 2.5 },
      ],
      [EXERCISES.PLANK]: [
        { threshold: 175, points: 15.0 },  // 2:55
        { threshold: 170, points: 14.5 },  // 2:50
        { threshold: 165, points: 14.0 },  // 2:45
        { threshold: 160, points: 13.5 },  // 2:40
        { threshold: 155, points: 13.0 },  // 2:35
        { threshold: 150, points: 12.5 },  // 2:30
        { threshold: 145, points: 12.0 },  // 2:25
        { threshold: 140, points: 11.5 },  // 2:20
        { threshold: 135, points: 11.0 },  // 2:15
        { threshold: 130, points: 10.5 },  // 2:10
        { threshold: 125, points: 10.0 },  // 2:05
        { threshold: 120, points: 9.5 },  // 2:00
        { threshold: 115, points: 9.0 },  // 1:55
        { threshold: 110, points: 8.5 },  // 1:50
        { threshold: 105, points: 8.0 },  // 1:45
        { threshold: 100, points: 7.5 },  // 1:40
        { threshold: 95, points: 7.0 },  // 1:35
        { threshold: 90, points: 6.5 },  // 1:30
        { threshold: 85, points: 6.0 },  // 1:25
        { threshold: 80, points: 5.5 },  // 1:20
        { threshold: 75, points: 5.0 },  // 1:15
        { threshold: 70, points: 4.5 },  // 1:10
        { threshold: 65, points: 4.0 },  // 1:05
        { threshold: 60, points: 3.5 },  // 1:00
        { threshold: 55, points: 3.0 },  // 0:55
        { threshold: 50, points: 2.5 },  // 0:50
      ],
    },
  },
}

// WHtR is universal (not age/gender specific)
// Source: Final USAF Physical Fitness Readiness Assessment Scoring (Effective 1 Mar 26)
export const WHTR_TABLE = [
  { threshold: 0.49, points: 20.0 },
  { threshold: 0.50, points: 19.0 },
  { threshold: 0.51, points: 18.0 },
  { threshold: 0.52, points: 17.0 },
  { threshold: 0.53, points: 16.0 },
  { threshold: 0.54, points: 15.0 },
  { threshold: 0.55, points: 12.5 },
  { threshold: 0.56, points: 10.0 },
  { threshold: 0.57, points: 7.5 },
  { threshold: 0.58, points: 5.0 },
  { threshold: 0.59, points: 2.5 },
  { threshold: 0.60, points: 0.0 },
]

/**
 * Get scoring table for specific demographic and exercise
 * @param {string} gender - 'M' or 'F'
 * @param {string} ageGroup - Age group constant
 * @param {string} exercise - Exercise type constant
 * @returns {Array|null} Scoring table or null if not found
 */
export function getScoringTable(gender, ageGroup, exercise) {
  if (exercise === EXERCISES.WHTR) {
    return WHTR_TABLE
  }

  const genderTables = SCORING_TABLES[gender]
  if (!genderTables) {
    console.warn(`No scoring tables for gender: ${gender}`)
    return null
  }

  const ageGroupTables = genderTables[ageGroup]
  if (!ageGroupTables) {
    console.warn(`No scoring tables for age group: ${ageGroup} (gender: ${gender})`)
    console.warn('Available age groups:', Object.keys(genderTables))
    return null
  }

  const exerciseTable = ageGroupTables[exercise]
  if (!exerciseTable) {
    console.warn(`No scoring table for exercise: ${exercise} (gender: ${gender}, age: ${ageGroup})`)
    return null
  }

  return exerciseTable
}
