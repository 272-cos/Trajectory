/**
 * Scoring tables for 2026 PFA (50-20-15-15 model)
 * Source: PT Charts New 50-20-15-15 with 2Mile FINAL 23 Sep 2025 (AFPC)
 * All 18 age/gender brackets (9 age brackets x 2 genders)
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
 * For reps/shuttles: threshold = minimum reps/shuttles for that point value
 * For plank: threshold = minimum hold time in seconds
 * For WHtR: threshold = max ratio for that point value
 */

export const SCORING_TABLES = {
  [GENDER.MALE]: {
    // Male <25
    [AGE_BRACKETS.UNDER_25]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 805, points: 50.0 }, // 13:25
        { threshold: 835, points: 49.4 }, // 13:55
        { threshold: 852, points: 48.8 }, // 14:12
        { threshold: 867, points: 48.1 }, // 14:27
        { threshold: 881, points: 47.5 }, // 14:41
        { threshold: 905, points: 46.9 }, // 15:05
        { threshold: 917, points: 46.3 }, // 15:17
        { threshold: 928, points: 45.6 }, // 15:28
        { threshold: 938, points: 45.0 }, // 15:38
        { threshold: 969, points: 43.9 }, // 16:09
        { threshold: 989, points: 42.9 }, // 16:29
        { threshold: 1009, points: 41.8 }, // 16:49
        { threshold: 1028, points: 40.7 }, // 17:08
        { threshold: 1038, points: 39.6 }, // 17:18
        { threshold: 1057, points: 38.6 }, // 17:37
        { threshold: 1075, points: 37.5 }, // 17:55
        { threshold: 1103, points: 35.5 }, // 18:23
        { threshold: 1119, points: 34.0 }, // 18:39
        { threshold: 1147, points: 32.5 }, // 19:07
        { threshold: 1176, points: 31.0 }, // 19:36
        { threshold: 1185, points: 29.5 }, // 19:45
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 100, points: 50.0 },
        { threshold: 94, points: 49.4 },
        { threshold: 92, points: 48.8 },
        { threshold: 88, points: 48.1 },
        { threshold: 86, points: 47.5 },
        { threshold: 83, points: 46.9 },
        { threshold: 80, points: 46.3 },
        { threshold: 77, points: 45.6 },
        { threshold: 74, points: 45.0 },
        { threshold: 71, points: 43.9 },
        { threshold: 68, points: 42.9 },
        { threshold: 65, points: 41.8 },
        { threshold: 62, points: 40.7 },
        { threshold: 59, points: 39.6 },
        { threshold: 56, points: 38.6 },
        { threshold: 54, points: 37.5 },
        { threshold: 51, points: 35.5 },
        { threshold: 48, points: 34.0 },
        { threshold: 45, points: 32.5 },
        { threshold: 42, points: 31.0 },
        { threshold: 39, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 67, points: 15.0 },
        { threshold: 66, points: 14.9 },
        { threshold: 65, points: 14.7 },
        { threshold: 64, points: 14.6 },
        { threshold: 63, points: 14.4 },
        { threshold: 62, points: 14.3 },
        { threshold: 61, points: 14.1 },
        { threshold: 60, points: 14.0 },
        { threshold: 59, points: 13.8 },
        { threshold: 58, points: 13.7 },
        { threshold: 57, points: 13.5 },
        { threshold: 56, points: 13.4 },
        { threshold: 55, points: 13.2 },
        { threshold: 54, points: 13.1 },
        { threshold: 53, points: 12.9 },
        { threshold: 52, points: 12.8 },
        { threshold: 51, points: 12.6 },
        { threshold: 50, points: 12.5 },
        { threshold: 49, points: 12.3 },
        { threshold: 48, points: 12.2 },
        { threshold: 47, points: 12.0 },
        { threshold: 46, points: 11.7 },
        { threshold: 45, points: 11.6 },
        { threshold: 44, points: 11.3 },
        { threshold: 43, points: 11.0 },
        { threshold: 42, points: 10.8 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 10.2 },
        { threshold: 39, points: 9.8 },
        { threshold: 38, points: 9.5 },
        { threshold: 37, points: 9.0 },
        { threshold: 36, points: 8.7 },
        { threshold: 35, points: 8.3 },
        { threshold: 34, points: 8.0 },
        { threshold: 33, points: 7.5 },
        { threshold: 32, points: 5.3 },
        { threshold: 31, points: 3.0 },
        { threshold: 30, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 40, points: 15.0 },
        { threshold: 39, points: 14.7 },
        { threshold: 38, points: 14.4 },
        { threshold: 37, points: 14.1 },
        { threshold: 36, points: 13.8 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.2 },
        { threshold: 33, points: 12.9 },
        { threshold: 32, points: 12.6 },
        { threshold: 31, points: 12.3 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.7 },
        { threshold: 28, points: 11.4 },
        { threshold: 27, points: 11.1 },
        { threshold: 26, points: 10.8 },
        { threshold: 25, points: 10.5 },
        { threshold: 24, points: 10.2 },
        { threshold: 23, points: 9.9 },
        { threshold: 22, points: 9.6 },
        { threshold: 21, points: 9.3 },
        { threshold: 20, points: 9.0 },
        { threshold: 19, points: 8.7 },
        { threshold: 18, points: 8.4 },
        { threshold: 17, points: 8.1 },
        { threshold: 16, points: 7.8 },
        { threshold: 15, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 58, points: 15.0 },
        { threshold: 57, points: 14.8 },
        { threshold: 56, points: 14.6 },
        { threshold: 55, points: 14.3 },
        { threshold: 54, points: 14.1 },
        { threshold: 53, points: 13.8 },
        { threshold: 52, points: 13.5 },
        { threshold: 51, points: 13.2 },
        { threshold: 50, points: 13.1 },
        { threshold: 49, points: 12.8 },
        { threshold: 48, points: 12.5 },
        { threshold: 47, points: 12.0 },
        { threshold: 46, points: 11.3 },
        { threshold: 45, points: 10.5 },
        { threshold: 44, points: 9.8 },
        { threshold: 43, points: 9.5 },
        { threshold: 42, points: 9.0 },
        { threshold: 41, points: 6.8 },
        { threshold: 40, points: 4.5 },
        { threshold: 39, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 49, points: 15.0 },
        { threshold: 48, points: 14.7 },
        { threshold: 47, points: 14.5 },
        { threshold: 46, points: 14.2 },
        { threshold: 45, points: 14.0 },
        { threshold: 44, points: 13.7 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.2 },
        { threshold: 41, points: 12.9 },
        { threshold: 40, points: 12.6 },
        { threshold: 39, points: 12.3 },
        { threshold: 38, points: 12.1 },
        { threshold: 37, points: 11.8 },
        { threshold: 36, points: 11.6 },
        { threshold: 35, points: 11.3 },
        { threshold: 34, points: 11.0 },
        { threshold: 33, points: 10.8 },
        { threshold: 32, points: 10.5 },
        { threshold: 31, points: 10.2 },
        { threshold: 30, points: 9.9 },
        { threshold: 29, points: 9.7 },
        { threshold: 28, points: 9.4 },
        { threshold: 27, points: 9.1 },
        { threshold: 26, points: 8.9 },
        { threshold: 25, points: 8.6 },
        { threshold: 24, points: 8.4 },
        { threshold: 23, points: 8.1 },
        { threshold: 22, points: 7.8 },
        { threshold: 21, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 215, points: 15.0 }, // 3:35
        { threshold: 210, points: 14.8 }, // 3:30
        { threshold: 205, points: 14.5 }, // 3:25
        { threshold: 198, points: 14.2 }, // 3:18
        { threshold: 192, points: 13.9 }, // 3:12
        { threshold: 185, points: 13.5 }, // 3:05
        { threshold: 165, points: 12.6 }, // 2:45
        { threshold: 145, points: 11.5 }, // 2:25
        { threshold: 125, points: 10.5 }, // 2:05
        { threshold: 115, points: 10.0 }, // 1:55
        { threshold: 85, points: 8.5 }, // 1:25
        { threshold: 65, points: 7.5 }, // 1:05
      ],
    },
    // Male 25-29
    [AGE_BRACKETS.AGE_25_29]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 805, points: 50.0 }, // 13:25
        { threshold: 835, points: 49.4 }, // 13:55
        { threshold: 852, points: 48.8 }, // 14:12
        { threshold: 867, points: 48.1 }, // 14:27
        { threshold: 881, points: 47.5 }, // 14:41
        { threshold: 905, points: 46.9 }, // 15:05
        { threshold: 917, points: 46.3 }, // 15:17
        { threshold: 928, points: 45.6 }, // 15:28
        { threshold: 938, points: 45.0 }, // 15:38
        { threshold: 974, points: 43.9 }, // 16:14
        { threshold: 993, points: 42.9 }, // 16:33
        { threshold: 1012, points: 41.8 }, // 16:52
        { threshold: 1032, points: 40.7 }, // 17:12
        { threshold: 1050, points: 39.6 }, // 17:30
        { threshold: 1067, points: 38.6 }, // 17:47
        { threshold: 1084, points: 37.5 }, // 18:04
        { threshold: 1103, points: 35.5 }, // 18:23
        { threshold: 1119, points: 34.0 }, // 18:39
        { threshold: 1155, points: 32.5 }, // 19:15
        { threshold: 1170, points: 31.0 }, // 19:30
        { threshold: 1185, points: 29.5 }, // 19:45
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 97, points: 50.0 },
        { threshold: 92, points: 49.4 },
        { threshold: 88, points: 48.8 },
        { threshold: 86, points: 48.1 },
        { threshold: 83, points: 47.5 },
        { threshold: 80, points: 46.9 },
        { threshold: 77, points: 46.3 },
        { threshold: 74, points: 45.6 },
        { threshold: 71, points: 45.0 },
        { threshold: 68, points: 43.9 },
        { threshold: 65, points: 42.9 },
        { threshold: 62, points: 41.8 },
        { threshold: 59, points: 40.7 },
        { threshold: 56, points: 39.6 },
        { threshold: 54, points: 38.6 },
        { threshold: 51, points: 37.5 },
        { threshold: 48, points: 35.5 },
        { threshold: 45, points: 34.0 },
        { threshold: 42, points: 32.5 },
        { threshold: 39, points: 31.0 },
        { threshold: 36, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 62, points: 15.0 },
        { threshold: 61, points: 14.8 },
        { threshold: 60, points: 14.6 },
        { threshold: 59, points: 14.3 },
        { threshold: 58, points: 14.1 },
        { threshold: 57, points: 14.0 },
        { threshold: 56, points: 13.8 },
        { threshold: 55, points: 13.7 },
        { threshold: 54, points: 13.5 },
        { threshold: 53, points: 13.4 },
        { threshold: 52, points: 13.2 },
        { threshold: 51, points: 13.1 },
        { threshold: 50, points: 13.0 },
        { threshold: 49, points: 12.9 },
        { threshold: 48, points: 12.8 },
        { threshold: 47, points: 12.6 },
        { threshold: 46, points: 12.5 },
        { threshold: 45, points: 12.2 },
        { threshold: 44, points: 12.0 },
        { threshold: 43, points: 11.7 },
        { threshold: 42, points: 11.6 },
        { threshold: 41, points: 11.3 },
        { threshold: 40, points: 11.0 },
        { threshold: 39, points: 10.8 },
        { threshold: 38, points: 10.5 },
        { threshold: 37, points: 10.2 },
        { threshold: 36, points: 9.8 },
        { threshold: 35, points: 9.5 },
        { threshold: 34, points: 9.0 },
        { threshold: 33, points: 8.7 },
        { threshold: 32, points: 8.3 },
        { threshold: 31, points: 8.0 },
        { threshold: 30, points: 7.5 },
        { threshold: 29, points: 5.3 },
        { threshold: 28, points: 3.0 },
        { threshold: 27, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 40, points: 15.0 },
        { threshold: 39, points: 14.7 },
        { threshold: 38, points: 14.4 },
        { threshold: 37, points: 14.1 },
        { threshold: 36, points: 13.8 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.2 },
        { threshold: 33, points: 12.9 },
        { threshold: 32, points: 12.6 },
        { threshold: 31, points: 12.3 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.7 },
        { threshold: 28, points: 11.4 },
        { threshold: 27, points: 11.1 },
        { threshold: 26, points: 10.8 },
        { threshold: 25, points: 10.5 },
        { threshold: 24, points: 10.2 },
        { threshold: 23, points: 9.9 },
        { threshold: 22, points: 9.6 },
        { threshold: 21, points: 9.3 },
        { threshold: 20, points: 9.0 },
        { threshold: 19, points: 8.7 },
        { threshold: 18, points: 8.4 },
        { threshold: 17, points: 8.1 },
        { threshold: 16, points: 7.8 },
        { threshold: 15, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 56, points: 15.0 },
        { threshold: 55, points: 14.6 },
        { threshold: 54, points: 14.3 },
        { threshold: 53, points: 14.1 },
        { threshold: 52, points: 13.8 },
        { threshold: 51, points: 13.5 },
        { threshold: 50, points: 13.2 },
        { threshold: 49, points: 13.1 },
        { threshold: 48, points: 12.8 },
        { threshold: 47, points: 12.5 },
        { threshold: 46, points: 12.0 },
        { threshold: 45, points: 11.3 },
        { threshold: 44, points: 10.5 },
        { threshold: 43, points: 9.8 },
        { threshold: 42, points: 9.5 },
        { threshold: 41, points: 9.0 },
        { threshold: 40, points: 6.8 },
        { threshold: 39, points: 4.5 },
        { threshold: 38, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 48, points: 15.0 },
        { threshold: 47, points: 14.6 },
        { threshold: 46, points: 14.3 },
        { threshold: 45, points: 14.1 },
        { threshold: 44, points: 13.8 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.2 },
        { threshold: 41, points: 13.1 },
        { threshold: 40, points: 12.8 },
        { threshold: 39, points: 12.5 },
        { threshold: 38, points: 12.0 },
        { threshold: 37, points: 11.3 },
        { threshold: 36, points: 10.5 },
        { threshold: 35, points: 9.8 },
        { threshold: 34, points: 9.5 },
        { threshold: 33, points: 9.0 },
        { threshold: 32, points: 6.8 },
        { threshold: 31, points: 4.5 },
        { threshold: 30, points: 2.3 },
        { threshold: 29, points: 6.6 },
        { threshold: 28, points: 6.5 },
        { threshold: 27, points: 6.3 },
        { threshold: 26, points: 6.1 },
        { threshold: 25, points: 5.9 },
        { threshold: 24, points: 5.7 },
        { threshold: 23, points: 5.6 },
        { threshold: 22, points: 5.4 },
        { threshold: 21, points: 5.2 },
        { threshold: 20, points: 5.0 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 210, points: 15.0 }, // 3:30
        { threshold: 205, points: 14.8 }, // 3:25
        { threshold: 200, points: 14.5 }, // 3:20
        { threshold: 194, points: 14.2 }, // 3:14
        { threshold: 183, points: 13.7 }, // 3:03
        { threshold: 180, points: 13.5 }, // 3:00
        { threshold: 160, points: 12.5 }, // 2:40
        { threshold: 140, points: 11.5 }, // 2:20
        { threshold: 120, points: 10.5 }, // 2:00
        { threshold: 100, points: 9.5 }, // 1:40
        { threshold: 80, points: 8.5 }, // 1:20
        { threshold: 60, points: 7.5 }, // 1:00
      ],
    },
    // Male 30-34
    [AGE_BRACKETS.AGE_30_34]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 822, points: 50.0 }, // 13:42
        { threshold: 863, points: 49.4 }, // 14:23
        { threshold: 877, points: 48.8 }, // 14:37
        { threshold: 889, points: 48.1 }, // 14:49
        { threshold: 901, points: 47.5 }, // 15:01
        { threshold: 923, points: 46.9 }, // 15:23
        { threshold: 933, points: 46.3 }, // 15:33
        { threshold: 943, points: 45.6 }, // 15:43
        { threshold: 950, points: 45.0 }, // 15:50
        { threshold: 972, points: 43.9 }, // 16:12
        { threshold: 990, points: 42.9 }, // 16:30
        { threshold: 1009, points: 41.8 }, // 16:49
        { threshold: 1027, points: 40.7 }, // 17:07
        { threshold: 1046, points: 39.6 }, // 17:26
        { threshold: 1062, points: 38.6 }, // 17:42
        { threshold: 1078, points: 37.5 }, // 17:58
        { threshold: 1110, points: 35.5 }, // 18:30
        { threshold: 1146, points: 34.0 }, // 19:06
        { threshold: 1174, points: 32.5 }, // 19:34
        { threshold: 1206, points: 31.0 }, // 20:06
        { threshold: 1244, points: 29.5 }, // 20:44
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 94, points: 50.0 },
        { threshold: 88, points: 49.4 },
        { threshold: 86, points: 48.8 },
        { threshold: 83, points: 48.1 },
        { threshold: 80, points: 47.5 },
        { threshold: 77, points: 46.9 },
        { threshold: 74, points: 46.3 },
        { threshold: 71, points: 45.6 },
        { threshold: 68, points: 45.0 },
        { threshold: 65, points: 43.9 },
        { threshold: 62, points: 42.9 },
        { threshold: 59, points: 41.8 },
        { threshold: 56, points: 40.7 },
        { threshold: 54, points: 39.6 },
        { threshold: 51, points: 38.6 },
        { threshold: 48, points: 37.5 },
        { threshold: 45, points: 35.5 },
        { threshold: 42, points: 34.0 },
        { threshold: 39, points: 32.5 },
        { threshold: 36, points: 31.0 },
        { threshold: 33, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 57, points: 15.0 },
        { threshold: 56, points: 14.9 },
        { threshold: 55, points: 14.7 },
        { threshold: 54, points: 14.6 },
        { threshold: 53, points: 14.4 },
        { threshold: 52, points: 14.3 },
        { threshold: 51, points: 14.1 },
        { threshold: 50, points: 14.0 },
        { threshold: 49, points: 13.9 },
        { threshold: 48, points: 13.8 },
        { threshold: 47, points: 13.7 },
        { threshold: 46, points: 13.5 },
        { threshold: 45, points: 13.4 },
        { threshold: 44, points: 13.2 },
        { threshold: 43, points: 13.1 },
        { threshold: 42, points: 12.9 },
        { threshold: 41, points: 12.8 },
        { threshold: 40, points: 12.5 },
        { threshold: 39, points: 12.0 },
        { threshold: 38, points: 11.7 },
        { threshold: 37, points: 11.6 },
        { threshold: 36, points: 11.3 },
        { threshold: 35, points: 11.0 },
        { threshold: 34, points: 10.5 },
        { threshold: 33, points: 10.2 },
        { threshold: 32, points: 10.1 },
        { threshold: 31, points: 9.8 },
        { threshold: 30, points: 9.0 },
        { threshold: 29, points: 8.3 },
        { threshold: 28, points: 8.0 },
        { threshold: 27, points: 7.5 },
        { threshold: 26, points: 5.3 },
        { threshold: 25, points: 3.0 },
        { threshold: 24, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 40, points: 15.0 },
        { threshold: 39, points: 14.7 },
        { threshold: 38, points: 14.4 },
        { threshold: 37, points: 14.1 },
        { threshold: 36, points: 13.8 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.2 },
        { threshold: 33, points: 12.9 },
        { threshold: 32, points: 12.6 },
        { threshold: 31, points: 12.3 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.7 },
        { threshold: 28, points: 11.4 },
        { threshold: 27, points: 11.1 },
        { threshold: 26, points: 10.8 },
        { threshold: 25, points: 10.5 },
        { threshold: 24, points: 10.2 },
        { threshold: 23, points: 9.9 },
        { threshold: 22, points: 9.6 },
        { threshold: 21, points: 9.3 },
        { threshold: 20, points: 9.0 },
        { threshold: 19, points: 8.7 },
        { threshold: 18, points: 8.4 },
        { threshold: 17, points: 8.1 },
        { threshold: 16, points: 7.8 },
        { threshold: 15, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 54, points: 15.0 },
        { threshold: 53, points: 14.8 },
        { threshold: 52, points: 14.6 },
        { threshold: 51, points: 14.3 },
        { threshold: 50, points: 14.1 },
        { threshold: 49, points: 13.8 },
        { threshold: 48, points: 13.5 },
        { threshold: 47, points: 13.2 },
        { threshold: 46, points: 13.1 },
        { threshold: 45, points: 12.8 },
        { threshold: 44, points: 12.5 },
        { threshold: 43, points: 12.0 },
        { threshold: 42, points: 11.3 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 9.8 },
        { threshold: 39, points: 9.0 },
        { threshold: 38, points: 6.8 },
        { threshold: 37, points: 4.5 },
        { threshold: 36, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 47, points: 15.0 },
        { threshold: 46, points: 14.7 },
        { threshold: 45, points: 14.5 },
        { threshold: 44, points: 14.2 },
        { threshold: 43, points: 14.0 },
        { threshold: 42, points: 13.7 },
        { threshold: 41, points: 13.4 },
        { threshold: 40, points: 13.1 },
        { threshold: 39, points: 12.8 },
        { threshold: 38, points: 12.6 },
        { threshold: 37, points: 12.3 },
        { threshold: 36, points: 12.1 },
        { threshold: 35, points: 11.8 },
        { threshold: 34, points: 11.6 },
        { threshold: 33, points: 11.3 },
        { threshold: 32, points: 11.0 },
        { threshold: 31, points: 10.7 },
        { threshold: 30, points: 10.4 },
        { threshold: 29, points: 10.2 },
        { threshold: 28, points: 9.9 },
        { threshold: 27, points: 9.7 },
        { threshold: 26, points: 9.4 },
        { threshold: 25, points: 9.1 },
        { threshold: 24, points: 8.9 },
        { threshold: 23, points: 8.6 },
        { threshold: 22, points: 8.3 },
        { threshold: 21, points: 8.0 },
        { threshold: 20, points: 7.8 },
        { threshold: 19, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 205, points: 15.0 }, // 3:25
        { threshold: 200, points: 14.8 }, // 3:20
        { threshold: 195, points: 14.5 }, // 3:15
        { threshold: 189, points: 14.2 }, // 3:09
        { threshold: 182, points: 13.9 }, // 3:02
        { threshold: 175, points: 13.5 }, // 2:55
        { threshold: 155, points: 12.5 }, // 2:35
        { threshold: 135, points: 11.5 }, // 2:15
        { threshold: 115, points: 10.5 }, // 1:55
        { threshold: 95, points: 9.5 }, // 1:35
        { threshold: 75, points: 8.5 }, // 1:15
        { threshold: 55, points: 7.5 }, // 0:55
      ],
    },
    // Male 35-39
    [AGE_BRACKETS.AGE_35_39]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 822, points: 50.0 }, // 13:42
        { threshold: 872, points: 49.4 }, // 14:32
        { threshold: 886, points: 48.8 }, // 14:46
        { threshold: 899, points: 48.1 }, // 14:59
        { threshold: 910, points: 47.5 }, // 15:10
        { threshold: 932, points: 46.9 }, // 15:32
        { threshold: 942, points: 46.3 }, // 15:42
        { threshold: 952, points: 45.6 }, // 15:52
        { threshold: 961, points: 45.0 }, // 16:01
        { threshold: 989, points: 43.9 }, // 16:29
        { threshold: 1008, points: 42.9 }, // 16:48
        { threshold: 1026, points: 41.8 }, // 17:06
        { threshold: 1044, points: 40.7 }, // 17:24
        { threshold: 1061, points: 39.6 }, // 17:41
        { threshold: 1078, points: 38.6 }, // 17:58
        { threshold: 1094, points: 37.5 }, // 18:14
        { threshold: 1115, points: 35.5 }, // 18:35
        { threshold: 1144, points: 34.0 }, // 19:04
        { threshold: 1171, points: 32.5 }, // 19:31
        { threshold: 1212, points: 31.0 }, // 20:12
        { threshold: 1244, points: 29.5 }, // 20:44
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 92, points: 50.0 },
        { threshold: 87, points: 49.4 },
        { threshold: 83, points: 48.8 },
        { threshold: 80, points: 48.1 },
        { threshold: 77, points: 47.5 },
        { threshold: 74, points: 46.9 },
        { threshold: 71, points: 46.3 },
        { threshold: 68, points: 45.6 },
        { threshold: 65, points: 45.0 },
        { threshold: 62, points: 43.9 },
        { threshold: 59, points: 42.9 },
        { threshold: 56, points: 41.8 },
        { threshold: 54, points: 40.7 },
        { threshold: 51, points: 39.6 },
        { threshold: 48, points: 38.6 },
        { threshold: 45, points: 37.5 },
        { threshold: 42, points: 35.5 },
        { threshold: 39, points: 34.0 },
        { threshold: 36, points: 32.5 },
        { threshold: 33, points: 31.0 },
        { threshold: 30, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 51, points: 15.0 },
        { threshold: 50, points: 14.6 },
        { threshold: 49, points: 14.3 },
        { threshold: 48, points: 14.1 },
        { threshold: 47, points: 14.0 },
        { threshold: 46, points: 13.9 },
        { threshold: 45, points: 13.8 },
        { threshold: 44, points: 13.7 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.4 },
        { threshold: 41, points: 13.2 },
        { threshold: 40, points: 13.1 },
        { threshold: 39, points: 12.9 },
        { threshold: 38, points: 12.8 },
        { threshold: 37, points: 12.5 },
        { threshold: 36, points: 12.0 },
        { threshold: 35, points: 11.7 },
        { threshold: 34, points: 11.6 },
        { threshold: 33, points: 11.3 },
        { threshold: 32, points: 11.0 },
        { threshold: 31, points: 10.5 },
        { threshold: 30, points: 10.2 },
        { threshold: 29, points: 10.1 },
        { threshold: 28, points: 9.8 },
        { threshold: 27, points: 9.0 },
        { threshold: 26, points: 8.3 },
        { threshold: 25, points: 8.0 },
        { threshold: 24, points: 7.5 },
        { threshold: 23, points: 5.3 },
        { threshold: 22, points: 3.0 },
        { threshold: 21, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 40, points: 15.0 },
        { threshold: 39, points: 14.7 },
        { threshold: 38, points: 14.4 },
        { threshold: 37, points: 14.1 },
        { threshold: 36, points: 13.8 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.2 },
        { threshold: 33, points: 12.9 },
        { threshold: 32, points: 12.6 },
        { threshold: 31, points: 12.3 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.7 },
        { threshold: 28, points: 11.4 },
        { threshold: 27, points: 11.1 },
        { threshold: 26, points: 10.8 },
        { threshold: 25, points: 10.5 },
        { threshold: 24, points: 10.2 },
        { threshold: 23, points: 9.9 },
        { threshold: 22, points: 9.6 },
        { threshold: 21, points: 9.3 },
        { threshold: 20, points: 9.0 },
        { threshold: 19, points: 8.7 },
        { threshold: 18, points: 8.4 },
        { threshold: 17, points: 8.1 },
        { threshold: 16, points: 7.8 },
        { threshold: 15, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 52, points: 15.0 },
        { threshold: 51, points: 14.8 },
        { threshold: 50, points: 14.6 },
        { threshold: 49, points: 14.3 },
        { threshold: 48, points: 14.1 },
        { threshold: 47, points: 13.8 },
        { threshold: 46, points: 13.5 },
        { threshold: 45, points: 13.2 },
        { threshold: 44, points: 13.1 },
        { threshold: 43, points: 12.8 },
        { threshold: 42, points: 12.5 },
        { threshold: 41, points: 12.0 },
        { threshold: 40, points: 11.3 },
        { threshold: 39, points: 10.5 },
        { threshold: 38, points: 9.8 },
        { threshold: 37, points: 9.0 },
        { threshold: 36, points: 6.8 },
        { threshold: 35, points: 4.5 },
        { threshold: 34, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 46, points: 15.0 },
        { threshold: 45, points: 14.7 },
        { threshold: 44, points: 14.5 },
        { threshold: 43, points: 14.2 },
        { threshold: 42, points: 14.0 },
        { threshold: 41, points: 13.7 },
        { threshold: 40, points: 13.4 },
        { threshold: 39, points: 13.1 },
        { threshold: 38, points: 12.8 },
        { threshold: 37, points: 12.6 },
        { threshold: 36, points: 12.3 },
        { threshold: 35, points: 12.1 },
        { threshold: 34, points: 11.8 },
        { threshold: 33, points: 11.6 },
        { threshold: 32, points: 11.3 },
        { threshold: 31, points: 11.0 },
        { threshold: 30, points: 10.7 },
        { threshold: 29, points: 10.4 },
        { threshold: 28, points: 10.2 },
        { threshold: 27, points: 9.9 },
        { threshold: 26, points: 9.7 },
        { threshold: 25, points: 9.4 },
        { threshold: 24, points: 9.1 },
        { threshold: 23, points: 8.9 },
        { threshold: 22, points: 8.6 },
        { threshold: 21, points: 8.3 },
        { threshold: 20, points: 8.0 },
        { threshold: 19, points: 7.8 },
        { threshold: 18, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 200, points: 15.0 }, // 3:20
        { threshold: 195, points: 14.8 }, // 3:15
        { threshold: 190, points: 14.5 }, // 3:10
        { threshold: 184, points: 14.2 }, // 3:04
        { threshold: 177, points: 13.9 }, // 2:57
        { threshold: 170, points: 13.5 }, // 2:50
        { threshold: 150, points: 12.5 }, // 2:30
        { threshold: 130, points: 11.5 }, // 2:10
        { threshold: 110, points: 10.5 }, // 1:50
        { threshold: 90, points: 9.5 }, // 1:30
        { threshold: 70, points: 8.5 }, // 1:10
        { threshold: 50, points: 7.5 }, // 0:50
      ],
    },
    // Male 40-44
    [AGE_BRACKETS.AGE_40_44]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 845, points: 50.0 }, // 14:05
        { threshold: 885, points: 49.4 }, // 14:45
        { threshold: 899, points: 48.8 }, // 14:59
        { threshold: 912, points: 48.1 }, // 15:12
        { threshold: 924, points: 47.5 }, // 15:24
        { threshold: 945, points: 46.9 }, // 15:45
        { threshold: 955, points: 46.3 }, // 15:55
        { threshold: 965, points: 45.6 }, // 16:05
        { threshold: 975, points: 45.0 }, // 16:15
        { threshold: 1003, points: 43.9 }, // 16:43
        { threshold: 1021, points: 42.9 }, // 17:01
        { threshold: 1039, points: 41.8 }, // 17:19
        { threshold: 1057, points: 40.7 }, // 17:37
        { threshold: 1076, points: 39.6 }, // 17:56
        { threshold: 1095, points: 38.6 }, // 18:15
        { threshold: 1115, points: 37.5 }, // 18:35
        { threshold: 1135, points: 35.5 }, // 18:55
        { threshold: 1176, points: 34.0 }, // 19:36
        { threshold: 1210, points: 32.5 }, // 20:10
        { threshold: 1269, points: 31.0 }, // 21:09
        { threshold: 1324, points: 29.5 }, // 22:04
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 88, points: 50.0 },
        { threshold: 83, points: 49.4 },
        { threshold: 80, points: 48.8 },
        { threshold: 77, points: 48.1 },
        { threshold: 74, points: 47.5 },
        { threshold: 71, points: 46.9 },
        { threshold: 68, points: 46.3 },
        { threshold: 65, points: 45.6 },
        { threshold: 62, points: 45.0 },
        { threshold: 59, points: 43.9 },
        { threshold: 56, points: 42.9 },
        { threshold: 54, points: 41.8 },
        { threshold: 51, points: 40.7 },
        { threshold: 48, points: 39.6 },
        { threshold: 45, points: 38.6 },
        { threshold: 42, points: 37.5 },
        { threshold: 39, points: 35.5 },
        { threshold: 36, points: 34.0 },
        { threshold: 33, points: 32.5 },
        { threshold: 30, points: 31.0 },
        { threshold: 27, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.8 },
        { threshold: 42, points: 14.6 },
        { threshold: 41, points: 14.4 },
        { threshold: 40, points: 14.3 },
        { threshold: 39, points: 14.1 },
        { threshold: 38, points: 13.8 },
        { threshold: 37, points: 13.7 },
        { threshold: 36, points: 13.5 },
        { threshold: 35, points: 13.2 },
        { threshold: 34, points: 12.8 },
        { threshold: 33, points: 12.6 },
        { threshold: 32, points: 12.5 },
        { threshold: 31, points: 12.2 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.3 },
        { threshold: 28, points: 11.0 },
        { threshold: 27, points: 10.8 },
        { threshold: 26, points: 10.5 },
        { threshold: 25, points: 9.8 },
        { threshold: 24, points: 9.0 },
        { threshold: 23, points: 8.7 },
        { threshold: 22, points: 8.3 },
        { threshold: 21, points: 7.5 },
        { threshold: 20, points: 5.3 },
        { threshold: 19, points: 3.0 },
        { threshold: 18, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 38, points: 15.0 },
        { threshold: 37, points: 14.7 },
        { threshold: 36, points: 14.4 },
        { threshold: 35, points: 14.1 },
        { threshold: 34, points: 13.8 },
        { threshold: 33, points: 13.5 },
        { threshold: 32, points: 13.2 },
        { threshold: 31, points: 12.9 },
        { threshold: 30, points: 12.6 },
        { threshold: 29, points: 12.3 },
        { threshold: 28, points: 12.0 },
        { threshold: 27, points: 11.7 },
        { threshold: 26, points: 11.4 },
        { threshold: 25, points: 11.1 },
        { threshold: 24, points: 10.8 },
        { threshold: 23, points: 10.5 },
        { threshold: 22, points: 10.2 },
        { threshold: 21, points: 9.9 },
        { threshold: 20, points: 9.6 },
        { threshold: 19, points: 9.3 },
        { threshold: 18, points: 9.0 },
        { threshold: 17, points: 8.7 },
        { threshold: 16, points: 8.4 },
        { threshold: 15, points: 8.1 },
        { threshold: 14, points: 7.8 },
        { threshold: 13, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 50, points: 15.0 },
        { threshold: 49, points: 14.8 },
        { threshold: 48, points: 14.6 },
        { threshold: 47, points: 14.3 },
        { threshold: 46, points: 14.1 },
        { threshold: 45, points: 13.8 },
        { threshold: 44, points: 13.7 },
        { threshold: 43, points: 13.5 },
        { threshold: 42, points: 13.2 },
        { threshold: 41, points: 13.1 },
        { threshold: 40, points: 12.8 },
        { threshold: 39, points: 12.0 },
        { threshold: 38, points: 11.7 },
        { threshold: 37, points: 11.3 },
        { threshold: 36, points: 10.5 },
        { threshold: 35, points: 9.8 },
        { threshold: 34, points: 9.0 },
        { threshold: 33, points: 6.8 },
        { threshold: 32, points: 4.5 },
        { threshold: 31, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.7 },
        { threshold: 42, points: 14.5 },
        { threshold: 41, points: 14.2 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.7 },
        { threshold: 38, points: 13.4 },
        { threshold: 37, points: 13.1 },
        { threshold: 36, points: 12.8 },
        { threshold: 35, points: 12.6 },
        { threshold: 34, points: 12.3 },
        { threshold: 33, points: 12.1 },
        { threshold: 32, points: 11.8 },
        { threshold: 31, points: 11.6 },
        { threshold: 30, points: 11.3 },
        { threshold: 29, points: 11.0 },
        { threshold: 28, points: 10.7 },
        { threshold: 27, points: 10.4 },
        { threshold: 26, points: 10.2 },
        { threshold: 25, points: 9.9 },
        { threshold: 24, points: 9.7 },
        { threshold: 23, points: 9.4 },
        { threshold: 22, points: 9.1 },
        { threshold: 21, points: 8.9 },
        { threshold: 20, points: 8.6 },
        { threshold: 19, points: 8.3 },
        { threshold: 18, points: 8.0 },
        { threshold: 17, points: 7.8 },
        { threshold: 16, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 195, points: 15.0 }, // 3:15
        { threshold: 190, points: 14.8 }, // 3:10
        { threshold: 185, points: 14.5 }, // 3:05
        { threshold: 179, points: 14.2 }, // 2:59
        { threshold: 172, points: 13.9 }, // 2:52
        { threshold: 165, points: 13.5 }, // 2:45
        { threshold: 145, points: 12.5 }, // 2:25
        { threshold: 125, points: 11.5 }, // 2:05
        { threshold: 125, points: 11.5 }, // 2:05
        { threshold: 105, points: 10.5 }, // 1:45
        { threshold: 85, points: 9.5 }, // 1:25
        { threshold: 65, points: 8.5 }, // 1:05
        { threshold: 45, points: 7.5 }, // 0:45
      ],
    },
    // Male 45-49
    [AGE_BRACKETS.AGE_45_49]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 870, points: 50.0 }, // 14:30
        { threshold: 908, points: 49.4 }, // 15:08
        { threshold: 922, points: 48.8 }, // 15:22
        { threshold: 935, points: 48.1 }, // 15:35
        { threshold: 947, points: 47.5 }, // 15:47
        { threshold: 969, points: 46.9 }, // 16:09
        { threshold: 979, points: 46.3 }, // 16:19
        { threshold: 989, points: 45.6 }, // 16:29
        { threshold: 999, points: 45.0 }, // 16:39
        { threshold: 1027, points: 43.9 }, // 17:07
        { threshold: 1045, points: 42.9 }, // 17:25
        { threshold: 1064, points: 41.8 }, // 17:44
        { threshold: 1082, points: 40.7 }, // 18:02
        { threshold: 1101, points: 39.6 }, // 18:21
        { threshold: 1121, points: 38.6 }, // 18:41
        { threshold: 1140, points: 37.5 }, // 19:00
        { threshold: 1170, points: 35.5 }, // 19:30
        { threshold: 1202, points: 34.0 }, // 20:02
        { threshold: 1250, points: 32.5 }, // 20:50
        { threshold: 1297, points: 31.0 }, // 21:37
        { threshold: 1324, points: 29.5 }, // 22:04
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 86, points: 50.0 },
        { threshold: 80, points: 49.4 },
        { threshold: 77, points: 48.8 },
        { threshold: 74, points: 48.1 },
        { threshold: 71, points: 47.5 },
        { threshold: 68, points: 46.9 },
        { threshold: 65, points: 46.3 },
        { threshold: 62, points: 45.6 },
        { threshold: 59, points: 45.0 },
        { threshold: 56, points: 43.9 },
        { threshold: 54, points: 42.9 },
        { threshold: 51, points: 41.8 },
        { threshold: 48, points: 40.7 },
        { threshold: 45, points: 39.6 },
        { threshold: 42, points: 38.6 },
        { threshold: 39, points: 37.5 },
        { threshold: 36, points: 35.5 },
        { threshold: 33, points: 34.0 },
        { threshold: 30, points: 32.5 },
        { threshold: 27, points: 31.0 },
        { threshold: 24, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.9 },
        { threshold: 42, points: 14.7 },
        { threshold: 41, points: 14.6 },
        { threshold: 40, points: 14.4 },
        { threshold: 39, points: 14.3 },
        { threshold: 38, points: 14.1 },
        { threshold: 37, points: 13.8 },
        { threshold: 36, points: 13.7 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.2 },
        { threshold: 33, points: 12.8 },
        { threshold: 32, points: 12.6 },
        { threshold: 31, points: 12.5 },
        { threshold: 30, points: 12.2 },
        { threshold: 29, points: 12.0 },
        { threshold: 28, points: 11.3 },
        { threshold: 27, points: 11.0 },
        { threshold: 26, points: 10.8 },
        { threshold: 25, points: 10.5 },
        { threshold: 24, points: 9.8 },
        { threshold: 23, points: 9.5 },
        { threshold: 22, points: 9.0 },
        { threshold: 21, points: 8.7 },
        { threshold: 20, points: 8.3 },
        { threshold: 19, points: 8.0 },
        { threshold: 18, points: 7.5 },
        { threshold: 17, points: 5.3 },
        { threshold: 16, points: 3.0 },
        { threshold: 15, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 38, points: 15.0 },
        { threshold: 37, points: 14.7 },
        { threshold: 36, points: 14.4 },
        { threshold: 35, points: 14.1 },
        { threshold: 34, points: 13.8 },
        { threshold: 33, points: 13.5 },
        { threshold: 32, points: 13.2 },
        { threshold: 31, points: 12.9 },
        { threshold: 30, points: 12.6 },
        { threshold: 29, points: 12.3 },
        { threshold: 28, points: 12.0 },
        { threshold: 27, points: 11.7 },
        { threshold: 26, points: 11.4 },
        { threshold: 25, points: 11.1 },
        { threshold: 24, points: 10.8 },
        { threshold: 23, points: 10.5 },
        { threshold: 22, points: 10.2 },
        { threshold: 21, points: 9.9 },
        { threshold: 20, points: 9.6 },
        { threshold: 19, points: 9.3 },
        { threshold: 18, points: 9.0 },
        { threshold: 17, points: 8.7 },
        { threshold: 16, points: 8.4 },
        { threshold: 15, points: 8.1 },
        { threshold: 14, points: 7.8 },
        { threshold: 13, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 48, points: 15.0 },
        { threshold: 47, points: 14.8 },
        { threshold: 46, points: 14.6 },
        { threshold: 45, points: 14.4 },
        { threshold: 44, points: 14.3 },
        { threshold: 43, points: 14.1 },
        { threshold: 42, points: 13.8 },
        { threshold: 41, points: 13.5 },
        { threshold: 40, points: 13.2 },
        { threshold: 39, points: 13.1 },
        { threshold: 38, points: 12.8 },
        { threshold: 37, points: 12.5 },
        { threshold: 36, points: 12.0 },
        { threshold: 35, points: 11.7 },
        { threshold: 34, points: 11.3 },
        { threshold: 33, points: 10.5 },
        { threshold: 32, points: 9.8 },
        { threshold: 31, points: 9.0 },
        { threshold: 30, points: 6.8 },
        { threshold: 29, points: 4.5 },
        { threshold: 28, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 43, points: 15.0 },
        { threshold: 42, points: 14.8 },
        { threshold: 41, points: 14.6 },
        { threshold: 40, points: 14.3 },
        { threshold: 39, points: 14.1 },
        { threshold: 38, points: 13.8 },
        { threshold: 37, points: 13.6 },
        { threshold: 36, points: 13.4 },
        { threshold: 35, points: 13.1 },
        { threshold: 34, points: 12.9 },
        { threshold: 33, points: 12.7 },
        { threshold: 32, points: 12.5 },
        { threshold: 31, points: 12.2 },
        { threshold: 30, points: 11.9 },
        { threshold: 29, points: 11.7 },
        { threshold: 28, points: 11.5 },
        { threshold: 27, points: 11.3 },
        { threshold: 26, points: 11.0 },
        { threshold: 25, points: 10.8 },
        { threshold: 24, points: 10.6 },
        { threshold: 23, points: 10.4 },
        { threshold: 22, points: 10.1 },
        { threshold: 21, points: 9.8 },
        { threshold: 20, points: 9.6 },
        { threshold: 19, points: 9.4 },
        { threshold: 18, points: 9.2 },
        { threshold: 17, points: 8.9 },
        { threshold: 16, points: 8.7 },
        { threshold: 15, points: 8.5 },
        { threshold: 14, points: 8.2 },
        { threshold: 13, points: 8.0 },
        { threshold: 12, points: 7.7 },
        { threshold: 11, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 190, points: 15.0 }, // 3:10
        { threshold: 185, points: 14.8 }, // 3:05
        { threshold: 180, points: 14.5 }, // 3:00
        { threshold: 174, points: 14.2 }, // 2:54
        { threshold: 167, points: 13.9 }, // 2:47
        { threshold: 160, points: 13.5 }, // 2:40
        { threshold: 140, points: 12.5 }, // 2:20
        { threshold: 120, points: 11.5 }, // 2:00
        { threshold: 100, points: 10.5 }, // 1:40
        { threshold: 80, points: 9.5 }, // 1:20
        { threshold: 60, points: 8.5 }, // 1:00
        { threshold: 40, points: 7.5 }, // 0:40
      ],
    },
    // Male 50-54
    [AGE_BRACKETS.AGE_50_54]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 909, points: 50.0 }, // 15:09
        { threshold: 954, points: 49.4 }, // 15:54
        { threshold: 968, points: 48.8 }, // 16:08
        { threshold: 981, points: 48.1 }, // 16:21
        { threshold: 993, points: 47.5 }, // 16:33
        { threshold: 1015, points: 46.9 }, // 16:55
        { threshold: 1026, points: 46.3 }, // 17:06
        { threshold: 1036, points: 45.6 }, // 17:16
        { threshold: 1046, points: 45.0 }, // 17:26
        { threshold: 1074, points: 43.9 }, // 17:54
        { threshold: 1093, points: 42.9 }, // 18:13
        { threshold: 1112, points: 41.8 }, // 18:32
        { threshold: 1131, points: 40.7 }, // 18:51
        { threshold: 1150, points: 39.6 }, // 19:10
        { threshold: 1170, points: 38.6 }, // 19:30
        { threshold: 1189, points: 37.5 }, // 19:49
        { threshold: 1220, points: 35.5 }, // 20:20
        { threshold: 1263, points: 34.0 }, // 21:03
        { threshold: 1300, points: 32.5 }, // 21:40
        { threshold: 1348, points: 31.0 }, // 22:28
        { threshold: 1370, points: 29.5 }, // 22:50
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 80, points: 50.0 },
        { threshold: 74, points: 49.4 },
        { threshold: 71, points: 48.8 },
        { threshold: 68, points: 48.1 },
        { threshold: 65, points: 47.5 },
        { threshold: 62, points: 46.9 },
        { threshold: 59, points: 46.3 },
        { threshold: 56, points: 45.6 },
        { threshold: 54, points: 45.0 },
        { threshold: 51, points: 43.9 },
        { threshold: 48, points: 42.9 },
        { threshold: 45, points: 41.8 },
        { threshold: 42, points: 40.7 },
        { threshold: 39, points: 39.6 },
        { threshold: 36, points: 38.6 },
        { threshold: 33, points: 37.5 },
        { threshold: 30, points: 35.5 },
        { threshold: 27, points: 34.0 },
        { threshold: 24, points: 32.5 },
        { threshold: 22, points: 31.0 },
        { threshold: 19, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 36, points: 15.0 },
        { threshold: 35, points: 14.8 },
        { threshold: 34, points: 14.6 },
        { threshold: 33, points: 14.3 },
        { threshold: 32, points: 14.1 },
        { threshold: 31, points: 13.8 },
        { threshold: 30, points: 13.7 },
        { threshold: 29, points: 13.5 },
        { threshold: 28, points: 13.2 },
        { threshold: 27, points: 13.1 },
        { threshold: 26, points: 12.8 },
        { threshold: 25, points: 12.5 },
        { threshold: 24, points: 12.0 },
        { threshold: 23, points: 11.3 },
        { threshold: 22, points: 10.5 },
        { threshold: 21, points: 9.8 },
        { threshold: 20, points: 9.5 },
        { threshold: 19, points: 9.0 },
        { threshold: 18, points: 8.7 },
        { threshold: 17, points: 8.3 },
        { threshold: 16, points: 8.0 },
        { threshold: 15, points: 7.5 },
        { threshold: 14, points: 5.3 },
        { threshold: 13, points: 3.0 },
        { threshold: 12, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 35, points: 15.0 },
        { threshold: 34, points: 14.7 },
        { threshold: 33, points: 14.4 },
        { threshold: 32, points: 14.1 },
        { threshold: 31, points: 13.7 },
        { threshold: 30, points: 13.4 },
        { threshold: 29, points: 13.1 },
        { threshold: 28, points: 12.8 },
        { threshold: 27, points: 12.5 },
        { threshold: 26, points: 12.2 },
        { threshold: 25, points: 11.9 },
        { threshold: 24, points: 11.6 },
        { threshold: 23, points: 11.3 },
        { threshold: 22, points: 11.0 },
        { threshold: 21, points: 10.7 },
        { threshold: 20, points: 10.4 },
        { threshold: 19, points: 10.0 },
        { threshold: 18, points: 9.7 },
        { threshold: 17, points: 9.4 },
        { threshold: 16, points: 9.1 },
        { threshold: 15, points: 8.8 },
        { threshold: 14, points: 8.5 },
        { threshold: 13, points: 8.1 },
        { threshold: 12, points: 7.8 },
        { threshold: 11, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 46, points: 15.0 },
        { threshold: 45, points: 14.8 },
        { threshold: 44, points: 14.6 },
        { threshold: 43, points: 14.3 },
        { threshold: 42, points: 14.1 },
        { threshold: 41, points: 13.8 },
        { threshold: 40, points: 13.7 },
        { threshold: 39, points: 13.5 },
        { threshold: 38, points: 13.2 },
        { threshold: 37, points: 13.1 },
        { threshold: 36, points: 12.8 },
        { threshold: 35, points: 12.0 },
        { threshold: 34, points: 11.7 },
        { threshold: 33, points: 11.3 },
        { threshold: 32, points: 11.0 },
        { threshold: 31, points: 10.5 },
        { threshold: 30, points: 9.8 },
        { threshold: 29, points: 9.5 },
        { threshold: 28, points: 9.0 },
        { threshold: 27, points: 6.8 },
        { threshold: 26, points: 4.5 },
        { threshold: 25, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.8 },
        { threshold: 40, points: 14.6 },
        { threshold: 39, points: 14.3 },
        { threshold: 38, points: 14.1 },
        { threshold: 37, points: 13.9 },
        { threshold: 36, points: 13.7 },
        { threshold: 35, points: 13.4 },
        { threshold: 34, points: 13.2 },
        { threshold: 33, points: 13.0 },
        { threshold: 32, points: 12.8 },
        { threshold: 31, points: 12.5 },
        { threshold: 30, points: 12.3 },
        { threshold: 29, points: 12.1 },
        { threshold: 28, points: 11.9 },
        { threshold: 27, points: 11.6 },
        { threshold: 26, points: 11.4 },
        { threshold: 25, points: 11.1 },
        { threshold: 24, points: 10.9 },
        { threshold: 23, points: 10.7 },
        { threshold: 22, points: 10.4 },
        { threshold: 21, points: 10.2 },
        { threshold: 20, points: 10.0 },
        { threshold: 19, points: 9.8 },
        { threshold: 18, points: 9.5 },
        { threshold: 17, points: 9.3 },
        { threshold: 16, points: 9.1 },
        { threshold: 15, points: 8.9 },
        { threshold: 14, points: 8.6 },
        { threshold: 13, points: 8.4 },
        { threshold: 12, points: 8.2 },
        { threshold: 11, points: 8.0 },
        { threshold: 10, points: 7.7 },
        { threshold: 9, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 185, points: 15.0 }, // 3:05
        { threshold: 180, points: 14.8 }, // 3:00
        { threshold: 175, points: 14.5 }, // 2:55
        { threshold: 169, points: 14.2 }, // 2:49
        { threshold: 162, points: 13.9 }, // 2:42
        { threshold: 155, points: 13.5 }, // 2:35
        { threshold: 135, points: 12.5 }, // 2:15
        { threshold: 115, points: 11.5 }, // 1:55
        { threshold: 95, points: 10.5 }, // 1:35
        { threshold: 75, points: 9.5 }, // 1:15
        { threshold: 55, points: 8.5 }, // 0:55
        { threshold: 35, points: 7.5 }, // 0:35
      ],
    },
    // Male 55-59
    [AGE_BRACKETS.AGE_55_59]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 928, points: 50.0 }, // 15:28
        { threshold: 982, points: 49.4 }, // 16:22
        { threshold: 1004, points: 48.8 }, // 16:44
        { threshold: 1018, points: 48.1 }, // 16:58
        { threshold: 1034, points: 47.5 }, // 17:14
        { threshold: 1065, points: 46.9 }, // 17:45
        { threshold: 1077, points: 46.3 }, // 17:57
        { threshold: 1087, points: 45.6 }, // 18:07
        { threshold: 1097, points: 45.0 }, // 18:17
        { threshold: 1125, points: 43.9 }, // 18:45
        { threshold: 1140, points: 42.9 }, // 19:00
        { threshold: 1157, points: 41.8 }, // 19:17
        { threshold: 1176, points: 40.7 }, // 19:36
        { threshold: 1191, points: 39.6 }, // 19:51
        { threshold: 1207, points: 38.6 }, // 20:07
        { threshold: 1222, points: 37.5 }, // 20:22
        { threshold: 1254, points: 35.5 }, // 20:54
        { threshold: 1279, points: 34.0 }, // 21:19
        { threshold: 1323, points: 32.5 }, // 22:03
        { threshold: 1378, points: 31.0 }, // 22:58
        { threshold: 1416, points: 29.5 }, // 23:36
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 77, points: 50.0 },
        { threshold: 71, points: 49.4 },
        { threshold: 68, points: 48.8 },
        { threshold: 65, points: 48.1 },
        { threshold: 62, points: 47.5 },
        { threshold: 59, points: 46.9 },
        { threshold: 56, points: 46.3 },
        { threshold: 54, points: 45.6 },
        { threshold: 51, points: 45.0 },
        { threshold: 48, points: 43.9 },
        { threshold: 45, points: 42.9 },
        { threshold: 42, points: 41.8 },
        { threshold: 39, points: 40.7 },
        { threshold: 36, points: 39.6 },
        { threshold: 33, points: 38.6 },
        { threshold: 30, points: 37.5 },
        { threshold: 27, points: 35.5 },
        { threshold: 24, points: 34.0 },
        { threshold: 22, points: 32.5 },
        { threshold: 19, points: 31.0 },
        { threshold: 16, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 33, points: 15.0 },
        { threshold: 32, points: 14.9 },
        { threshold: 31, points: 14.6 },
        { threshold: 30, points: 14.3 },
        { threshold: 29, points: 13.8 },
        { threshold: 28, points: 13.5 },
        { threshold: 27, points: 13.4 },
        { threshold: 26, points: 13.1 },
        { threshold: 25, points: 12.8 },
        { threshold: 24, points: 12.6 },
        { threshold: 23, points: 11.9 },
        { threshold: 22, points: 11.1 },
        { threshold: 21, points: 10.5 },
        { threshold: 20, points: 9.8 },
        { threshold: 19, points: 9.3 },
        { threshold: 18, points: 8.9 },
        { threshold: 17, points: 8.6 },
        { threshold: 16, points: 8.1 },
        { threshold: 15, points: 7.5 },
        { threshold: 14, points: 5.3 },
        { threshold: 13, points: 3.0 },
        { threshold: 12, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 33, points: 15.0 },
        { threshold: 32, points: 14.7 },
        { threshold: 31, points: 14.3 },
        { threshold: 30, points: 14.0 },
        { threshold: 29, points: 13.7 },
        { threshold: 28, points: 13.4 },
        { threshold: 27, points: 13.1 },
        { threshold: 26, points: 12.8 },
        { threshold: 25, points: 12.4 },
        { threshold: 24, points: 12.1 },
        { threshold: 23, points: 11.8 },
        { threshold: 22, points: 11.4 },
        { threshold: 21, points: 11.1 },
        { threshold: 20, points: 10.7 },
        { threshold: 19, points: 10.4 },
        { threshold: 18, points: 10.1 },
        { threshold: 17, points: 9.8 },
        { threshold: 16, points: 9.5 },
        { threshold: 15, points: 9.2 },
        { threshold: 14, points: 8.8 },
        { threshold: 13, points: 8.5 },
        { threshold: 12, points: 8.2 },
        { threshold: 11, points: 7.8 },
        { threshold: 10, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.8 },
        { threshold: 42, points: 14.6 },
        { threshold: 41, points: 14.3 },
        { threshold: 40, points: 14.1 },
        { threshold: 39, points: 13.8 },
        { threshold: 38, points: 13.7 },
        { threshold: 37, points: 13.5 },
        { threshold: 36, points: 13.2 },
        { threshold: 35, points: 13.1 },
        { threshold: 34, points: 12.8 },
        { threshold: 33, points: 12.0 },
        { threshold: 32, points: 11.7 },
        { threshold: 31, points: 11.3 },
        { threshold: 30, points: 11.0 },
        { threshold: 29, points: 10.5 },
        { threshold: 28, points: 10.2 },
        { threshold: 27, points: 9.8 },
        { threshold: 26, points: 9.5 },
        { threshold: 25, points: 9.0 },
        { threshold: 24, points: 6.8 },
        { threshold: 23, points: 4.5 },
        { threshold: 22, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 41, points: 15.0 },
        { threshold: 40, points: 14.8 },
        { threshold: 39, points: 14.6 },
        { threshold: 38, points: 14.3 },
        { threshold: 37, points: 14.1 },
        { threshold: 36, points: 13.9 },
        { threshold: 35, points: 13.7 },
        { threshold: 34, points: 13.4 },
        { threshold: 33, points: 13.2 },
        { threshold: 32, points: 13.0 },
        { threshold: 31, points: 12.8 },
        { threshold: 30, points: 12.5 },
        { threshold: 29, points: 12.3 },
        { threshold: 28, points: 12.1 },
        { threshold: 27, points: 11.9 },
        { threshold: 26, points: 11.6 },
        { threshold: 25, points: 11.4 },
        { threshold: 24, points: 11.1 },
        { threshold: 23, points: 10.9 },
        { threshold: 22, points: 10.7 },
        { threshold: 21, points: 10.4 },
        { threshold: 20, points: 10.2 },
        { threshold: 19, points: 10.0 },
        { threshold: 18, points: 9.8 },
        { threshold: 17, points: 9.5 },
        { threshold: 16, points: 9.3 },
        { threshold: 15, points: 9.1 },
        { threshold: 14, points: 8.9 },
        { threshold: 13, points: 8.6 },
        { threshold: 12, points: 8.4 },
        { threshold: 11, points: 8.2 },
        { threshold: 10, points: 8.0 },
        { threshold: 9, points: 7.7 },
        { threshold: 8, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 180, points: 15.0 }, // 3:00
        { threshold: 175, points: 14.8 }, // 2:55
        { threshold: 170, points: 14.5 }, // 2:50
        { threshold: 164, points: 14.2 }, // 2:44
        { threshold: 157, points: 13.9 }, // 2:37
        { threshold: 150, points: 13.5 }, // 2:30
        { threshold: 130, points: 12.5 }, // 2:10
        { threshold: 110, points: 11.5 }, // 1:50
        { threshold: 90, points: 10.5 }, // 1:30
        { threshold: 70, points: 9.5 }, // 1:10
        { threshold: 50, points: 8.5 }, // 0:50
        { threshold: 30, points: 7.5 }, // 0:30
      ],
    },
    // Male 60+
    [AGE_BRACKETS.AGE_60_PLUS]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 928, points: 50.0 }, // 15:28
        { threshold: 982, points: 49.4 }, // 16:22
        { threshold: 1004, points: 48.8 }, // 16:44
        { threshold: 1018, points: 48.1 }, // 16:58
        { threshold: 1034, points: 47.5 }, // 17:14
        { threshold: 1065, points: 46.9 }, // 17:45
        { threshold: 1077, points: 46.3 }, // 17:57
        { threshold: 1087, points: 45.6 }, // 18:07
        { threshold: 1097, points: 45.0 }, // 18:17
        { threshold: 1125, points: 43.9 }, // 18:45
        { threshold: 1140, points: 42.9 }, // 19:00
        { threshold: 1157, points: 41.8 }, // 19:17
        { threshold: 1176, points: 40.7 }, // 19:36
        { threshold: 1191, points: 39.6 }, // 19:51
        { threshold: 1207, points: 38.6 }, // 20:07
        { threshold: 1222, points: 37.5 }, // 20:22
        { threshold: 1254, points: 35.5 }, // 20:54
        { threshold: 1279, points: 34.0 }, // 21:19
        { threshold: 1323, points: 32.5 }, // 22:03
        { threshold: 1378, points: 31.0 }, // 22:58
        { threshold: 1416, points: 29.5 }, // 23:36
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 71, points: 50.0 },
        { threshold: 65, points: 49.4 },
        { threshold: 62, points: 48.8 },
        { threshold: 59, points: 48.1 },
        { threshold: 56, points: 47.5 },
        { threshold: 54, points: 46.9 },
        { threshold: 51, points: 46.3 },
        { threshold: 48, points: 45.6 },
        { threshold: 45, points: 45.0 },
        { threshold: 42, points: 43.9 },
        { threshold: 39, points: 42.9 },
        { threshold: 36, points: 41.8 },
        { threshold: 33, points: 40.7 },
        { threshold: 30, points: 39.6 },
        { threshold: 27, points: 38.6 },
        { threshold: 24, points: 37.5 },
        { threshold: 22, points: 35.5 },
        { threshold: 20, points: 34.0 },
        { threshold: 19, points: 32.5 },
        { threshold: 17, points: 31.0 },
        { threshold: 13, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 30, points: 15.0 },
        { threshold: 29, points: 14.6 },
        { threshold: 28, points: 14.3 },
        { threshold: 27, points: 14.0 },
        { threshold: 26, points: 13.5 },
        { threshold: 25, points: 13.2 },
        { threshold: 24, points: 12.8 },
        { threshold: 23, points: 12.0 },
        { threshold: 22, points: 11.3 },
        { threshold: 21, points: 10.5 },
        { threshold: 20, points: 9.8 },
        { threshold: 19, points: 9.5 },
        { threshold: 18, points: 9.0 },
        { threshold: 17, points: 8.7 },
        { threshold: 16, points: 8.3 },
        { threshold: 15, points: 8.0 },
        { threshold: 14, points: 7.5 },
        { threshold: 13, points: 5.3 },
        { threshold: 12, points: 3.0 },
        { threshold: 11, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 30, points: 15.0 },
        { threshold: 29, points: 14.6 },
        { threshold: 28, points: 14.3 },
        { threshold: 27, points: 13.9 },
        { threshold: 26, points: 13.5 },
        { threshold: 25, points: 13.1 },
        { threshold: 24, points: 12.8 },
        { threshold: 23, points: 12.4 },
        { threshold: 22, points: 12.0 },
        { threshold: 21, points: 11.6 },
        { threshold: 20, points: 11.3 },
        { threshold: 19, points: 10.9 },
        { threshold: 18, points: 10.5 },
        { threshold: 17, points: 10.1 },
        { threshold: 16, points: 9.8 },
        { threshold: 15, points: 9.4 },
        { threshold: 14, points: 9.0 },
        { threshold: 13, points: 8.6 },
        { threshold: 12, points: 8.3 },
        { threshold: 11, points: 7.9 },
        { threshold: 10, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.8 },
        { threshold: 40, points: 14.6 },
        { threshold: 39, points: 14.3 },
        { threshold: 38, points: 14.1 },
        { threshold: 37, points: 13.8 },
        { threshold: 36, points: 13.7 },
        { threshold: 35, points: 13.5 },
        { threshold: 34, points: 13.4 },
        { threshold: 33, points: 13.2 },
        { threshold: 32, points: 12.9 },
        { threshold: 31, points: 12.8 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.7 },
        { threshold: 28, points: 11.3 },
        { threshold: 27, points: 11.0 },
        { threshold: 26, points: 10.5 },
        { threshold: 25, points: 10.2 },
        { threshold: 24, points: 9.8 },
        { threshold: 23, points: 9.5 },
        { threshold: 22, points: 9.0 },
        { threshold: 21, points: 6.8 },
        { threshold: 20, points: 4.5 },
        { threshold: 19, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 35, points: 15.0 },
        { threshold: 34, points: 14.7 },
        { threshold: 33, points: 14.5 },
        { threshold: 32, points: 14.2 },
        { threshold: 31, points: 14.0 },
        { threshold: 30, points: 13.7 },
        { threshold: 29, points: 13.4 },
        { threshold: 28, points: 13.1 },
        { threshold: 27, points: 12.8 },
        { threshold: 26, points: 12.6 },
        { threshold: 25, points: 12.3 },
        { threshold: 24, points: 12.1 },
        { threshold: 23, points: 11.8 },
        { threshold: 22, points: 11.6 },
        { threshold: 21, points: 11.3 },
        { threshold: 20, points: 11.0 },
        { threshold: 19, points: 10.7 },
        { threshold: 18, points: 10.4 },
        { threshold: 17, points: 10.2 },
        { threshold: 16, points: 9.9 },
        { threshold: 15, points: 9.7 },
        { threshold: 14, points: 9.4 },
        { threshold: 13, points: 9.1 },
        { threshold: 12, points: 8.9 },
        { threshold: 11, points: 8.6 },
        { threshold: 10, points: 8.3 },
        { threshold: 9, points: 8.0 },
        { threshold: 8, points: 7.8 },
        { threshold: 7, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 175, points: 15.0 }, // 2:55
        { threshold: 170, points: 14.8 }, // 2:50
        { threshold: 165, points: 14.5 }, // 2:45
        { threshold: 159, points: 14.2 }, // 2:39
        { threshold: 152, points: 13.9 }, // 2:32
        { threshold: 145, points: 13.5 }, // 2:25
        { threshold: 125, points: 12.5 }, // 2:05
        { threshold: 115, points: 12.0 }, // 1:55
        { threshold: 85, points: 10.5 }, // 1:25
        { threshold: 65, points: 9.5 }, // 1:05
        { threshold: 45, points: 8.5 }, // 0:45
        { threshold: 25, points: 7.5 }, // 0:25
      ],
    },
  },
  [GENDER.FEMALE]: {
    // Female <25
    [AGE_BRACKETS.UNDER_25]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 930, points: 50.0 }, // 15:30
        { threshold: 955, points: 49.4 }, // 15:55
        { threshold: 960, points: 48.8 }, // 16:00
        { threshold: 964, points: 48.1 }, // 16:04
        { threshold: 987, points: 47.5 }, // 16:27
        { threshold: 1023, points: 46.9 }, // 17:03
        { threshold: 1037, points: 46.3 }, // 17:17
        { threshold: 1051, points: 45.6 }, // 17:31
        { threshold: 1064, points: 45.0 }, // 17:44
        { threshold: 1098, points: 43.9 }, // 18:18
        { threshold: 1118, points: 42.9 }, // 18:38
        { threshold: 1138, points: 41.8 }, // 18:58
        { threshold: 1156, points: 40.7 }, // 19:16
        { threshold: 1174, points: 39.6 }, // 19:34
        { threshold: 1192, points: 38.6 }, // 19:52
        { threshold: 1212, points: 37.5 }, // 20:12
        { threshold: 1257, points: 35.5 }, // 20:57
        { threshold: 1300, points: 34.0 }, // 21:40
        { threshold: 1327, points: 32.5 }, // 22:07
        { threshold: 1357, points: 31.0 }, // 22:37
        { threshold: 1365, points: 29.5 }, // 22:45
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 83, points: 50.0 },
        { threshold: 77, points: 49.4 },
        { threshold: 74, points: 48.8 },
        { threshold: 71, points: 48.1 },
        { threshold: 68, points: 47.5 },
        { threshold: 65, points: 46.9 },
        { threshold: 62, points: 46.3 },
        { threshold: 59, points: 45.6 },
        { threshold: 56, points: 45.0 },
        { threshold: 54, points: 43.9 },
        { threshold: 51, points: 42.9 },
        { threshold: 48, points: 41.8 },
        { threshold: 45, points: 40.7 },
        { threshold: 42, points: 39.6 },
        { threshold: 39, points: 38.6 },
        { threshold: 36, points: 37.5 },
        { threshold: 33, points: 35.5 },
        { threshold: 30, points: 34.0 },
        { threshold: 28, points: 32.5 },
        { threshold: 26, points: 31.0 },
        { threshold: 24, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 47, points: 15.0 },
        { threshold: 46, points: 14.9 },
        { threshold: 45, points: 14.7 },
        { threshold: 44, points: 14.6 },
        { threshold: 43, points: 14.4 },
        { threshold: 42, points: 14.3 },
        { threshold: 41, points: 14.1 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.8 },
        { threshold: 38, points: 13.7 },
        { threshold: 37, points: 13.5 },
        { threshold: 36, points: 13.4 },
        { threshold: 35, points: 13.2 },
        { threshold: 34, points: 12.9 },
        { threshold: 33, points: 12.8 },
        { threshold: 32, points: 12.6 },
        { threshold: 31, points: 12.5 },
        { threshold: 30, points: 12.3 },
        { threshold: 29, points: 12.2 },
        { threshold: 28, points: 12.0 },
        { threshold: 27, points: 11.3 },
        { threshold: 26, points: 11.0 },
        { threshold: 25, points: 10.8 },
        { threshold: 24, points: 10.5 },
        { threshold: 23, points: 9.8 },
        { threshold: 22, points: 9.5 },
        { threshold: 21, points: 9.0 },
        { threshold: 20, points: 8.7 },
        { threshold: 19, points: 8.3 },
        { threshold: 18, points: 7.5 },
        { threshold: 17, points: 5.3 },
        { threshold: 16, points: 3.0 },
        { threshold: 15, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 31, points: 15.0 },
        { threshold: 30, points: 14.7 },
        { threshold: 29, points: 14.4 },
        { threshold: 28, points: 14.1 },
        { threshold: 27, points: 13.8 },
        { threshold: 26, points: 13.5 },
        { threshold: 25, points: 13.2 },
        { threshold: 24, points: 12.9 },
        { threshold: 23, points: 12.6 },
        { threshold: 22, points: 12.3 },
        { threshold: 21, points: 12.0 },
        { threshold: 20, points: 11.7 },
        { threshold: 19, points: 11.4 },
        { threshold: 18, points: 11.1 },
        { threshold: 17, points: 10.8 },
        { threshold: 16, points: 10.5 },
        { threshold: 15, points: 10.2 },
        { threshold: 14, points: 9.9 },
        { threshold: 13, points: 9.6 },
        { threshold: 12, points: 9.3 },
        { threshold: 11, points: 9.0 },
        { threshold: 10, points: 8.7 },
        { threshold: 9, points: 8.4 },
        { threshold: 8, points: 8.1 },
        { threshold: 7, points: 7.8 },
        { threshold: 6, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 54, points: 15.0 },
        { threshold: 53, points: 14.8 },
        { threshold: 52, points: 14.6 },
        { threshold: 51, points: 14.3 },
        { threshold: 50, points: 14.1 },
        { threshold: 49, points: 13.5 },
        { threshold: 48, points: 13.4 },
        { threshold: 47, points: 13.2 },
        { threshold: 46, points: 12.9 },
        { threshold: 45, points: 12.8 },
        { threshold: 44, points: 12.0 },
        { threshold: 43, points: 11.7 },
        { threshold: 42, points: 11.3 },
        { threshold: 41, points: 10.5 },
        { threshold: 40, points: 10.2 },
        { threshold: 39, points: 9.8 },
        { threshold: 38, points: 9.0 },
        { threshold: 37, points: 6.8 },
        { threshold: 36, points: 4.5 },
        { threshold: 35, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 47, points: 15.0 },
        { threshold: 46, points: 14.8 },
        { threshold: 45, points: 14.6 },
        { threshold: 44, points: 14.4 },
        { threshold: 43, points: 14.2 },
        { threshold: 42, points: 14.0 },
        { threshold: 41, points: 13.7 },
        { threshold: 40, points: 13.6 },
        { threshold: 39, points: 13.4 },
        { threshold: 38, points: 13.1 },
        { threshold: 37, points: 12.9 },
        { threshold: 36, points: 12.7 },
        { threshold: 35, points: 12.5 },
        { threshold: 34, points: 12.3 },
        { threshold: 33, points: 12.1 },
        { threshold: 32, points: 11.9 },
        { threshold: 31, points: 11.7 },
        { threshold: 30, points: 11.5 },
        { threshold: 29, points: 11.3 },
        { threshold: 28, points: 11.0 },
        { threshold: 27, points: 10.8 },
        { threshold: 26, points: 10.7 },
        { threshold: 25, points: 10.4 },
        { threshold: 24, points: 10.2 },
        { threshold: 23, points: 10.0 },
        { threshold: 22, points: 9.8 },
        { threshold: 21, points: 9.6 },
        { threshold: 20, points: 9.4 },
        { threshold: 19, points: 9.2 },
        { threshold: 18, points: 8.9 },
        { threshold: 17, points: 8.8 },
        { threshold: 16, points: 8.6 },
        { threshold: 15, points: 8.3 },
        { threshold: 14, points: 8.1 },
        { threshold: 13, points: 8.0 },
        { threshold: 12, points: 7.7 },
        { threshold: 11, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 210, points: 15.0 }, // 3:30
        { threshold: 205, points: 14.3 }, // 3:25
        { threshold: 198, points: 14.0 }, // 3:18
        { threshold: 192, points: 13.9 }, // 3:12
        { threshold: 185, points: 13.7 }, // 3:05
        { threshold: 165, points: 11.9 }, // 2:45
        { threshold: 145, points: 11.4 }, // 2:25
        { threshold: 125, points: 10.8 }, // 2:05
        { threshold: 105, points: 9.1 }, // 1:45
        { threshold: 85, points: 8.5 }, // 1:25
        { threshold: 65, points: 7.9 }, // 1:05
        { threshold: 60, points: 7.7 }, // 1:00
        { threshold: 55, points: 7.5 }, // 0:55
      ],
    },
    // Female 25-29
    [AGE_BRACKETS.AGE_25_29]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 930, points: 50.0 }, // 15:30
        { threshold: 955, points: 49.4 }, // 15:55
        { threshold: 960, points: 48.8 }, // 16:00
        { threshold: 964, points: 48.1 }, // 16:04
        { threshold: 987, points: 47.5 }, // 16:27
        { threshold: 1023, points: 46.9 }, // 17:03
        { threshold: 1037, points: 46.3 }, // 17:17
        { threshold: 1051, points: 45.6 }, // 17:31
        { threshold: 1064, points: 45.0 }, // 17:44
        { threshold: 1120, points: 43.9 }, // 18:40
        { threshold: 1139, points: 42.9 }, // 18:59
        { threshold: 1158, points: 41.8 }, // 19:18
        { threshold: 1176, points: 40.7 }, // 19:36
        { threshold: 1193, points: 39.6 }, // 19:53
        { threshold: 1210, points: 38.6 }, // 20:10
        { threshold: 1226, points: 37.5 }, // 20:26
        { threshold: 1258, points: 35.5 }, // 20:58
        { threshold: 1283, points: 34.0 }, // 21:23
        { threshold: 1309, points: 32.5 }, // 21:49
        { threshold: 1339, points: 31.0 }, // 22:19
        { threshold: 1365, points: 29.5 }, // 22:45
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 80, points: 50.0 },
        { threshold: 74, points: 49.4 },
        { threshold: 71, points: 48.8 },
        { threshold: 68, points: 48.1 },
        { threshold: 65, points: 47.5 },
        { threshold: 62, points: 46.9 },
        { threshold: 59, points: 46.3 },
        { threshold: 56, points: 45.6 },
        { threshold: 54, points: 45.0 },
        { threshold: 51, points: 43.9 },
        { threshold: 48, points: 42.9 },
        { threshold: 45, points: 41.8 },
        { threshold: 42, points: 40.7 },
        { threshold: 39, points: 39.6 },
        { threshold: 36, points: 38.6 },
        { threshold: 33, points: 37.5 },
        { threshold: 30, points: 35.5 },
        { threshold: 27, points: 34.0 },
        { threshold: 26, points: 32.5 },
        { threshold: 24, points: 31.0 },
        { threshold: 22, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 47, points: 15.0 },
        { threshold: 46, points: 14.9 },
        { threshold: 45, points: 14.7 },
        { threshold: 44, points: 14.6 },
        { threshold: 43, points: 14.4 },
        { threshold: 42, points: 14.3 },
        { threshold: 41, points: 14.1 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.8 },
        { threshold: 38, points: 13.7 },
        { threshold: 37, points: 13.5 },
        { threshold: 36, points: 13.4 },
        { threshold: 35, points: 13.2 },
        { threshold: 34, points: 12.9 },
        { threshold: 33, points: 12.8 },
        { threshold: 32, points: 12.6 },
        { threshold: 31, points: 12.5 },
        { threshold: 30, points: 12.3 },
        { threshold: 29, points: 12.2 },
        { threshold: 28, points: 12.0 },
        { threshold: 27, points: 11.3 },
        { threshold: 26, points: 11.0 },
        { threshold: 25, points: 10.8 },
        { threshold: 24, points: 10.5 },
        { threshold: 23, points: 9.8 },
        { threshold: 22, points: 9.5 },
        { threshold: 21, points: 9.0 },
        { threshold: 20, points: 8.7 },
        { threshold: 19, points: 8.3 },
        { threshold: 18, points: 8.0 },
        { threshold: 17, points: 7.5 },
        { threshold: 16, points: 5.3 },
        { threshold: 15, points: 3.0 },
        { threshold: 14, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 31, points: 15.0 },
        { threshold: 30, points: 14.7 },
        { threshold: 29, points: 14.4 },
        { threshold: 28, points: 14.1 },
        { threshold: 27, points: 13.8 },
        { threshold: 26, points: 13.5 },
        { threshold: 25, points: 13.2 },
        { threshold: 24, points: 12.9 },
        { threshold: 23, points: 12.6 },
        { threshold: 22, points: 12.3 },
        { threshold: 21, points: 12.0 },
        { threshold: 20, points: 11.7 },
        { threshold: 19, points: 11.4 },
        { threshold: 18, points: 11.1 },
        { threshold: 17, points: 10.8 },
        { threshold: 16, points: 10.5 },
        { threshold: 15, points: 10.2 },
        { threshold: 14, points: 9.9 },
        { threshold: 13, points: 9.6 },
        { threshold: 12, points: 9.3 },
        { threshold: 11, points: 9.0 },
        { threshold: 10, points: 8.7 },
        { threshold: 9, points: 8.4 },
        { threshold: 8, points: 8.1 },
        { threshold: 7, points: 7.8 },
        { threshold: 6, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 50, points: 15.0 },
        { threshold: 49, points: 14.6 },
        { threshold: 48, points: 14.3 },
        { threshold: 47, points: 14.1 },
        { threshold: 46, points: 13.5 },
        { threshold: 45, points: 13.4 },
        { threshold: 44, points: 12.9 },
        { threshold: 43, points: 12.8 },
        { threshold: 42, points: 12.0 },
        { threshold: 41, points: 11.7 },
        { threshold: 40, points: 11.3 },
        { threshold: 39, points: 11.0 },
        { threshold: 38, points: 10.5 },
        { threshold: 37, points: 10.2 },
        { threshold: 36, points: 9.8 },
        { threshold: 35, points: 9.5 },
        { threshold: 34, points: 9.0 },
        { threshold: 33, points: 6.8 },
        { threshold: 32, points: 4.5 },
        { threshold: 31, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 45, points: 15.0 },
        { threshold: 44, points: 14.8 },
        { threshold: 43, points: 14.6 },
        { threshold: 42, points: 14.4 },
        { threshold: 41, points: 14.2 },
        { threshold: 40, points: 14.0 },
        { threshold: 39, points: 13.7 },
        { threshold: 38, points: 13.6 },
        { threshold: 37, points: 13.4 },
        { threshold: 36, points: 13.1 },
        { threshold: 35, points: 12.9 },
        { threshold: 34, points: 12.7 },
        { threshold: 33, points: 12.5 },
        { threshold: 32, points: 12.3 },
        { threshold: 31, points: 12.1 },
        { threshold: 30, points: 11.9 },
        { threshold: 29, points: 11.7 },
        { threshold: 28, points: 11.5 },
        { threshold: 27, points: 11.3 },
        { threshold: 26, points: 11.0 },
        { threshold: 25, points: 10.8 },
        { threshold: 24, points: 10.7 },
        { threshold: 23, points: 10.4 },
        { threshold: 22, points: 10.2 },
        { threshold: 21, points: 10.0 },
        { threshold: 20, points: 9.8 },
        { threshold: 19, points: 9.6 },
        { threshold: 18, points: 9.4 },
        { threshold: 17, points: 9.2 },
        { threshold: 16, points: 8.9 },
        { threshold: 15, points: 8.8 },
        { threshold: 14, points: 8.6 },
        { threshold: 13, points: 8.3 },
        { threshold: 12, points: 8.1 },
        { threshold: 11, points: 8.0 },
        { threshold: 10, points: 7.7 },
        { threshold: 9, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 205, points: 15.0 }, // 3:25
        { threshold: 200, points: 14.9 }, // 3:20
        { threshold: 194, points: 14.7 }, // 3:14
        { threshold: 187, points: 14.5 }, // 3:07
        { threshold: 180, points: 14.3 }, // 3:00
        { threshold: 160, points: 12.7 }, // 2:40
        { threshold: 140, points: 12.2 }, // 2:20
        { threshold: 120, points: 11.6 }, // 2:00
        { threshold: 100, points: 10.0 }, // 1:40
        { threshold: 80, points: 9.4 }, // 1:20
        { threshold: 60, points: 8.9 }, // 1:00
        { threshold: 55, points: 7.7 }, // 0:55
        { threshold: 50, points: 7.5 }, // 0:50
      ],
    },
    // Female 30-34
    [AGE_BRACKETS.AGE_30_34]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 948, points: 50.0 }, // 15:48
        { threshold: 996, points: 49.4 }, // 16:36
        { threshold: 1014, points: 48.8 }, // 16:54
        { threshold: 1029, points: 48.1 }, // 17:09
        { threshold: 1043, points: 47.5 }, // 17:23
        { threshold: 1068, points: 46.9 }, // 17:48
        { threshold: 1079, points: 46.3 }, // 17:59
        { threshold: 1090, points: 45.6 }, // 18:10
        { threshold: 1101, points: 45.0 }, // 18:21
        { threshold: 1130, points: 43.9 }, // 18:50
        { threshold: 1149, points: 42.9 }, // 19:09
        { threshold: 1167, points: 41.8 }, // 19:27
        { threshold: 1185, points: 40.7 }, // 19:45
        { threshold: 1201, points: 39.6 }, // 20:01
        { threshold: 1217, points: 38.6 }, // 20:17
        { threshold: 1233, points: 37.5 }, // 20:33
        { threshold: 1265, points: 35.5 }, // 21:05
        { threshold: 1289, points: 34.0 }, // 21:29
        { threshold: 1315, points: 32.5 }, // 21:55
        { threshold: 1344, points: 31.0 }, // 22:24
        { threshold: 1370, points: 29.5 }, // 22:50
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 77, points: 50.0 },
        { threshold: 71, points: 49.4 },
        { threshold: 68, points: 48.8 },
        { threshold: 65, points: 48.1 },
        { threshold: 62, points: 47.5 },
        { threshold: 59, points: 46.9 },
        { threshold: 56, points: 46.3 },
        { threshold: 54, points: 45.6 },
        { threshold: 51, points: 45.0 },
        { threshold: 48, points: 43.9 },
        { threshold: 45, points: 42.9 },
        { threshold: 42, points: 41.8 },
        { threshold: 39, points: 40.7 },
        { threshold: 36, points: 39.6 },
        { threshold: 33, points: 38.6 },
        { threshold: 30, points: 37.5 },
        { threshold: 27, points: 35.5 },
        { threshold: 25, points: 34.0 },
        { threshold: 23, points: 32.5 },
        { threshold: 21, points: 31.0 },
        { threshold: 19, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 46, points: 15.0 },
        { threshold: 45, points: 14.9 },
        { threshold: 44, points: 14.8 },
        { threshold: 43, points: 14.7 },
        { threshold: 42, points: 14.6 },
        { threshold: 41, points: 14.4 },
        { threshold: 40, points: 14.3 },
        { threshold: 39, points: 14.1 },
        { threshold: 38, points: 14.0 },
        { threshold: 37, points: 13.9 },
        { threshold: 36, points: 13.8 },
        { threshold: 35, points: 13.7 },
        { threshold: 34, points: 13.6 },
        { threshold: 33, points: 13.5 },
        { threshold: 32, points: 13.4 },
        { threshold: 31, points: 13.3 },
        { threshold: 30, points: 13.2 },
        { threshold: 29, points: 13.1 },
        { threshold: 28, points: 13.0 },
        { threshold: 27, points: 12.9 },
        { threshold: 26, points: 12.8 },
        { threshold: 25, points: 12.5 },
        { threshold: 24, points: 12.3 },
        { threshold: 23, points: 12.0 },
        { threshold: 22, points: 11.9 },
        { threshold: 21, points: 11.7 },
        { threshold: 20, points: 11.4 },
        { threshold: 19, points: 11.3 },
        { threshold: 18, points: 10.5 },
        { threshold: 17, points: 10.2 },
        { threshold: 16, points: 9.8 },
        { threshold: 15, points: 9.0 },
        { threshold: 14, points: 7.5 },
        { threshold: 13, points: 5.3 },
        { threshold: 12, points: 3.0 },
        { threshold: 11, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 31, points: 15.0 },
        { threshold: 30, points: 14.7 },
        { threshold: 29, points: 14.4 },
        { threshold: 28, points: 14.1 },
        { threshold: 27, points: 13.8 },
        { threshold: 26, points: 13.5 },
        { threshold: 25, points: 13.2 },
        { threshold: 24, points: 12.9 },
        { threshold: 23, points: 12.6 },
        { threshold: 22, points: 12.3 },
        { threshold: 21, points: 12.0 },
        { threshold: 20, points: 11.7 },
        { threshold: 19, points: 11.4 },
        { threshold: 18, points: 11.1 },
        { threshold: 17, points: 10.8 },
        { threshold: 16, points: 10.5 },
        { threshold: 15, points: 10.2 },
        { threshold: 14, points: 9.9 },
        { threshold: 13, points: 9.6 },
        { threshold: 12, points: 9.3 },
        { threshold: 11, points: 9.0 },
        { threshold: 10, points: 8.7 },
        { threshold: 9, points: 8.4 },
        { threshold: 8, points: 8.1 },
        { threshold: 7, points: 7.8 },
        { threshold: 6, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 45, points: 15.0 },
        { threshold: 44, points: 14.8 },
        { threshold: 43, points: 14.6 },
        { threshold: 42, points: 14.3 },
        { threshold: 41, points: 14.1 },
        { threshold: 40, points: 13.5 },
        { threshold: 39, points: 13.2 },
        { threshold: 38, points: 12.8 },
        { threshold: 37, points: 12.5 },
        { threshold: 36, points: 12.3 },
        { threshold: 35, points: 12.0 },
        { threshold: 34, points: 11.7 },
        { threshold: 33, points: 11.3 },
        { threshold: 32, points: 10.5 },
        { threshold: 31, points: 10.2 },
        { threshold: 30, points: 9.8 },
        { threshold: 29, points: 9.0 },
        { threshold: 28, points: 6.8 },
        { threshold: 27, points: 4.5 },
        { threshold: 26, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 44, points: 15.0 },
        { threshold: 43, points: 14.8 },
        { threshold: 42, points: 14.6 },
        { threshold: 41, points: 14.3 },
        { threshold: 40, points: 14.2 },
        { threshold: 39, points: 14.0 },
        { threshold: 38, points: 13.7 },
        { threshold: 37, points: 13.5 },
        { threshold: 36, points: 13.3 },
        { threshold: 35, points: 13.1 },
        { threshold: 34, points: 12.8 },
        { threshold: 33, points: 12.7 },
        { threshold: 32, points: 12.5 },
        { threshold: 31, points: 12.2 },
        { threshold: 30, points: 12.0 },
        { threshold: 29, points: 11.8 },
        { threshold: 28, points: 11.6 },
        { threshold: 27, points: 11.3 },
        { threshold: 26, points: 11.2 },
        { threshold: 25, points: 11.0 },
        { threshold: 24, points: 10.7 },
        { threshold: 23, points: 10.5 },
        { threshold: 22, points: 10.3 },
        { threshold: 21, points: 10.1 },
        { threshold: 20, points: 9.8 },
        { threshold: 19, points: 9.7 },
        { threshold: 18, points: 9.5 },
        { threshold: 17, points: 9.2 },
        { threshold: 16, points: 9.0 },
        { threshold: 15, points: 8.8 },
        { threshold: 14, points: 8.6 },
        { threshold: 13, points: 8.3 },
        { threshold: 12, points: 8.2 },
        { threshold: 11, points: 8.0 },
        { threshold: 10, points: 7.7 },
        { threshold: 9, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 200, points: 15.0 }, // 3:20
        { threshold: 195, points: 14.8 }, // 3:15
        { threshold: 189, points: 14.5 }, // 3:09
        { threshold: 182, points: 14.1 }, // 3:02
        { threshold: 175, points: 13.8 }, // 2:55
        { threshold: 155, points: 12.8 }, // 2:35
        { threshold: 135, points: 11.9 }, // 2:15
        { threshold: 115, points: 10.9 }, // 1:55
        { threshold: 95, points: 9.9 }, // 1:35
        { threshold: 75, points: 8.9 }, // 1:15
        { threshold: 55, points: 8.0 }, // 0:55
        { threshold: 50, points: 7.7 }, // 0:50
        { threshold: 45, points: 7.5 }, // 0:45
      ],
    },
    // Female 35-39
    [AGE_BRACKETS.AGE_35_39]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 951, points: 50.0 }, // 15:51
        { threshold: 1002, points: 49.4 }, // 16:42
        { threshold: 1019, points: 48.8 }, // 16:59
        { threshold: 1034, points: 48.1 }, // 17:14
        { threshold: 1048, points: 47.5 }, // 17:28
        { threshold: 1073, points: 46.9 }, // 17:53
        { threshold: 1084, points: 46.3 }, // 18:04
        { threshold: 1095, points: 45.6 }, // 18:15
        { threshold: 1105, points: 45.0 }, // 18:25
        { threshold: 1134, points: 43.9 }, // 18:54
        { threshold: 1153, points: 42.9 }, // 19:13
        { threshold: 1171, points: 41.8 }, // 19:31
        { threshold: 1189, points: 40.7 }, // 19:49
        { threshold: 1205, points: 39.6 }, // 20:05
        { threshold: 1221, points: 38.6 }, // 20:21
        { threshold: 1237, points: 37.5 }, // 20:37
        { threshold: 1268, points: 35.5 }, // 21:08
        { threshold: 1292, points: 34.0 }, // 21:32
        { threshold: 1318, points: 32.5 }, // 21:58
        { threshold: 1347, points: 31.0 }, // 22:27
        { threshold: 1379, points: 29.5 }, // 22:59
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 74, points: 50.0 },
        { threshold: 68, points: 49.4 },
        { threshold: 65, points: 48.8 },
        { threshold: 62, points: 48.1 },
        { threshold: 59, points: 47.5 },
        { threshold: 56, points: 46.9 },
        { threshold: 54, points: 46.3 },
        { threshold: 51, points: 45.6 },
        { threshold: 48, points: 45.0 },
        { threshold: 45, points: 43.9 },
        { threshold: 42, points: 42.9 },
        { threshold: 39, points: 41.8 },
        { threshold: 36, points: 40.7 },
        { threshold: 33, points: 39.6 },
        { threshold: 30, points: 38.6 },
        { threshold: 27, points: 37.5 },
        { threshold: 24, points: 35.5 },
        { threshold: 22, points: 34.0 },
        { threshold: 20, points: 32.5 },
        { threshold: 18, points: 31.0 },
        { threshold: 16, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.8 },
        { threshold: 40, points: 14.6 },
        { threshold: 39, points: 14.3 },
        { threshold: 38, points: 14.1 },
        { threshold: 37, points: 14.0 },
        { threshold: 36, points: 13.9 },
        { threshold: 35, points: 13.8 },
        { threshold: 34, points: 13.7 },
        { threshold: 33, points: 13.6 },
        { threshold: 32, points: 13.5 },
        { threshold: 31, points: 13.4 },
        { threshold: 30, points: 13.3 },
        { threshold: 29, points: 13.2 },
        { threshold: 28, points: 13.1 },
        { threshold: 27, points: 13.0 },
        { threshold: 26, points: 12.9 },
        { threshold: 25, points: 12.8 },
        { threshold: 24, points: 12.5 },
        { threshold: 23, points: 12.3 },
        { threshold: 22, points: 12.0 },
        { threshold: 21, points: 11.9 },
        { threshold: 20, points: 11.7 },
        { threshold: 19, points: 11.4 },
        { threshold: 18, points: 11.3 },
        { threshold: 17, points: 10.5 },
        { threshold: 16, points: 10.2 },
        { threshold: 15, points: 9.8 },
        { threshold: 14, points: 9.0 },
        { threshold: 13, points: 7.5 },
        { threshold: 12, points: 5.3 },
        { threshold: 11, points: 3.0 },
        { threshold: 10, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 31, points: 15.0 },
        { threshold: 30, points: 14.7 },
        { threshold: 29, points: 14.4 },
        { threshold: 28, points: 14.1 },
        { threshold: 27, points: 13.8 },
        { threshold: 26, points: 13.5 },
        { threshold: 25, points: 13.2 },
        { threshold: 24, points: 12.9 },
        { threshold: 23, points: 12.6 },
        { threshold: 22, points: 12.3 },
        { threshold: 21, points: 12.0 },
        { threshold: 20, points: 11.7 },
        { threshold: 19, points: 11.4 },
        { threshold: 18, points: 11.1 },
        { threshold: 17, points: 10.8 },
        { threshold: 16, points: 10.5 },
        { threshold: 15, points: 10.2 },
        { threshold: 14, points: 9.9 },
        { threshold: 13, points: 9.6 },
        { threshold: 12, points: 9.3 },
        { threshold: 11, points: 9.0 },
        { threshold: 10, points: 8.7 },
        { threshold: 9, points: 8.4 },
        { threshold: 8, points: 8.1 },
        { threshold: 7, points: 7.8 },
        { threshold: 6, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 43, points: 15.0 },
        { threshold: 42, points: 14.8 },
        { threshold: 41, points: 14.6 },
        { threshold: 40, points: 14.3 },
        { threshold: 39, points: 14.1 },
        { threshold: 38, points: 13.5 },
        { threshold: 37, points: 13.2 },
        { threshold: 36, points: 12.8 },
        { threshold: 35, points: 12.5 },
        { threshold: 34, points: 12.3 },
        { threshold: 33, points: 12.0 },
        { threshold: 32, points: 11.7 },
        { threshold: 31, points: 11.3 },
        { threshold: 30, points: 10.5 },
        { threshold: 29, points: 10.2 },
        { threshold: 28, points: 9.8 },
        { threshold: 27, points: 9.0 },
        { threshold: 26, points: 6.8 },
        { threshold: 25, points: 4.5 },
        { threshold: 24, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 43, points: 15.0 },
        { threshold: 42, points: 14.8 },
        { threshold: 41, points: 14.6 },
        { threshold: 40, points: 14.4 },
        { threshold: 39, points: 14.2 },
        { threshold: 38, points: 14.0 },
        { threshold: 37, points: 13.7 },
        { threshold: 36, points: 13.6 },
        { threshold: 35, points: 13.4 },
        { threshold: 34, points: 13.1 },
        { threshold: 33, points: 12.9 },
        { threshold: 32, points: 12.7 },
        { threshold: 31, points: 12.5 },
        { threshold: 30, points: 12.3 },
        { threshold: 29, points: 12.1 },
        { threshold: 28, points: 11.9 },
        { threshold: 27, points: 11.7 },
        { threshold: 26, points: 11.5 },
        { threshold: 25, points: 11.3 },
        { threshold: 24, points: 11.0 },
        { threshold: 23, points: 10.8 },
        { threshold: 22, points: 10.7 },
        { threshold: 21, points: 10.4 },
        { threshold: 20, points: 10.2 },
        { threshold: 19, points: 10.0 },
        { threshold: 18, points: 9.8 },
        { threshold: 17, points: 9.6 },
        { threshold: 16, points: 9.4 },
        { threshold: 15, points: 9.2 },
        { threshold: 14, points: 8.9 },
        { threshold: 13, points: 8.8 },
        { threshold: 12, points: 8.6 },
        { threshold: 11, points: 8.3 },
        { threshold: 10, points: 8.1 },
        { threshold: 9, points: 8.0 },
        { threshold: 8, points: 7.7 },
        { threshold: 7, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 195, points: 15.0 }, // 3:15
        { threshold: 190, points: 14.8 }, // 3:10
        { threshold: 184, points: 14.5 }, // 3:04
        { threshold: 177, points: 14.1 }, // 2:57
        { threshold: 170, points: 13.8 }, // 2:50
        { threshold: 150, points: 12.8 }, // 2:30
        { threshold: 130, points: 11.9 }, // 2:10
        { threshold: 110, points: 10.9 }, // 1:50
        { threshold: 90, points: 9.9 }, // 1:30
        { threshold: 70, points: 8.9 }, // 1:10
        { threshold: 50, points: 8.0 }, // 0:50
        { threshold: 45, points: 7.7 }, // 0:45
      ],
    },
    // Female 40-44
    [AGE_BRACKETS.AGE_40_44]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 960, points: 50.0 }, // 16:00
        { threshold: 1012, points: 49.4 }, // 16:52
        { threshold: 1030, points: 48.8 }, // 17:10
        { threshold: 1045, points: 48.1 }, // 17:25
        { threshold: 1059, points: 47.5 }, // 17:39
        { threshold: 1084, points: 46.9 }, // 18:04
        { threshold: 1096, points: 46.3 }, // 18:16
        { threshold: 1106, points: 45.6 }, // 18:26
        { threshold: 1117, points: 45.0 }, // 18:37
        { threshold: 1147, points: 43.9 }, // 19:07
        { threshold: 1165, points: 42.9 }, // 19:25
        { threshold: 1184, points: 41.8 }, // 19:44
        { threshold: 1201, points: 40.7 }, // 20:01
        { threshold: 1218, points: 39.6 }, // 20:18
        { threshold: 1234, points: 38.6 }, // 20:34
        { threshold: 1250, points: 37.5 }, // 20:50
        { threshold: 1282, points: 35.5 }, // 21:22
        { threshold: 1306, points: 34.0 }, // 21:46
        { threshold: 1332, points: 32.5 }, // 22:12
        { threshold: 1362, points: 31.0 }, // 22:42
        { threshold: 1395, points: 29.5 }, // 23:15
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 71, points: 50.0 },
        { threshold: 65, points: 49.4 },
        { threshold: 62, points: 48.8 },
        { threshold: 59, points: 48.1 },
        { threshold: 56, points: 47.5 },
        { threshold: 54, points: 46.9 },
        { threshold: 51, points: 46.3 },
        { threshold: 48, points: 45.6 },
        { threshold: 45, points: 45.0 },
        { threshold: 42, points: 43.9 },
        { threshold: 39, points: 42.9 },
        { threshold: 36, points: 41.8 },
        { threshold: 33, points: 40.7 },
        { threshold: 30, points: 39.6 },
        { threshold: 27, points: 38.6 },
        { threshold: 24, points: 37.5 },
        { threshold: 22, points: 35.5 },
        { threshold: 19, points: 34.0 },
        { threshold: 17, points: 32.5 },
        { threshold: 15, points: 31.0 },
        { threshold: 13, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 38, points: 15.0 },
        { threshold: 37, points: 14.9 },
        { threshold: 36, points: 14.7 },
        { threshold: 35, points: 14.6 },
        { threshold: 34, points: 14.4 },
        { threshold: 33, points: 14.3 },
        { threshold: 32, points: 14.1 },
        { threshold: 31, points: 13.8 },
        { threshold: 30, points: 13.7 },
        { threshold: 29, points: 13.5 },
        { threshold: 28, points: 13.4 },
        { threshold: 27, points: 13.2 },
        { threshold: 26, points: 13.1 },
        { threshold: 25, points: 13.0 },
        { threshold: 24, points: 12.9 },
        { threshold: 23, points: 12.8 },
        { threshold: 22, points: 12.6 },
        { threshold: 21, points: 12.5 },
        { threshold: 20, points: 12.3 },
        { threshold: 19, points: 12.2 },
        { threshold: 18, points: 12.0 },
        { threshold: 17, points: 11.7 },
        { threshold: 16, points: 11.3 },
        { threshold: 15, points: 10.5 },
        { threshold: 14, points: 9.8 },
        { threshold: 13, points: 9.0 },
        { threshold: 12, points: 8.3 },
        { threshold: 11, points: 7.5 },
        { threshold: 10, points: 5.3 },
        { threshold: 9, points: 3.0 },
        { threshold: 8, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 28, points: 15.0 },
        { threshold: 27, points: 14.7 },
        { threshold: 26, points: 14.4 },
        { threshold: 25, points: 14.1 },
        { threshold: 24, points: 13.8 },
        { threshold: 23, points: 13.5 },
        { threshold: 22, points: 13.2 },
        { threshold: 21, points: 12.9 },
        { threshold: 20, points: 12.6 },
        { threshold: 19, points: 12.3 },
        { threshold: 18, points: 12.0 },
        { threshold: 17, points: 11.7 },
        { threshold: 16, points: 11.4 },
        { threshold: 15, points: 11.1 },
        { threshold: 14, points: 10.8 },
        { threshold: 13, points: 10.5 },
        { threshold: 12, points: 10.2 },
        { threshold: 11, points: 9.9 },
        { threshold: 10, points: 9.6 },
        { threshold: 9, points: 9.3 },
        { threshold: 8, points: 9.0 },
        { threshold: 7, points: 8.7 },
        { threshold: 6, points: 8.4 },
        { threshold: 5, points: 8.1 },
        { threshold: 4, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 41, points: 15.0 },
        { threshold: 40, points: 14.8 },
        { threshold: 39, points: 14.6 },
        { threshold: 38, points: 14.3 },
        { threshold: 37, points: 14.1 },
        { threshold: 36, points: 13.8 },
        { threshold: 35, points: 13.7 },
        { threshold: 34, points: 13.5 },
        { threshold: 33, points: 13.2 },
        { threshold: 32, points: 12.8 },
        { threshold: 31, points: 12.5 },
        { threshold: 30, points: 12.3 },
        { threshold: 29, points: 12.0 },
        { threshold: 28, points: 11.3 },
        { threshold: 27, points: 10.5 },
        { threshold: 26, points: 10.2 },
        { threshold: 25, points: 9.6 },
        { threshold: 24, points: 9.0 },
        { threshold: 23, points: 6.8 },
        { threshold: 22, points: 4.5 },
        { threshold: 21, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 42, points: 15.0 },
        { threshold: 41, points: 14.8 },
        { threshold: 40, points: 14.6 },
        { threshold: 39, points: 14.4 },
        { threshold: 38, points: 14.2 },
        { threshold: 37, points: 14.0 },
        { threshold: 36, points: 13.7 },
        { threshold: 35, points: 13.6 },
        { threshold: 34, points: 13.4 },
        { threshold: 33, points: 13.1 },
        { threshold: 32, points: 12.9 },
        { threshold: 31, points: 12.7 },
        { threshold: 30, points: 12.5 },
        { threshold: 29, points: 12.3 },
        { threshold: 28, points: 12.1 },
        { threshold: 27, points: 11.9 },
        { threshold: 26, points: 11.7 },
        { threshold: 25, points: 11.5 },
        { threshold: 24, points: 11.3 },
        { threshold: 23, points: 11.0 },
        { threshold: 22, points: 10.8 },
        { threshold: 21, points: 10.7 },
        { threshold: 20, points: 10.4 },
        { threshold: 19, points: 10.2 },
        { threshold: 18, points: 10.0 },
        { threshold: 17, points: 9.8 },
        { threshold: 16, points: 9.6 },
        { threshold: 15, points: 9.4 },
        { threshold: 14, points: 9.2 },
        { threshold: 13, points: 8.9 },
        { threshold: 12, points: 8.8 },
        { threshold: 11, points: 8.6 },
        { threshold: 10, points: 8.3 },
        { threshold: 9, points: 8.1 },
        { threshold: 8, points: 8.0 },
        { threshold: 7, points: 7.7 },
        { threshold: 6, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 190, points: 15.0 }, // 3:10
        { threshold: 185, points: 14.8 }, // 3:05
        { threshold: 179, points: 14.5 }, // 2:59
        { threshold: 172, points: 14.1 }, // 2:52
        { threshold: 165, points: 13.8 }, // 2:45
        { threshold: 145, points: 12.8 }, // 2:25
        { threshold: 125, points: 11.9 }, // 2:05
        { threshold: 105, points: 10.9 }, // 1:45
        { threshold: 85, points: 9.9 }, // 1:25
        { threshold: 65, points: 8.9 }, // 1:05
        { threshold: 45, points: 8.0 }, // 0:45
        { threshold: 40, points: 7.7 }, // 0:40
        { threshold: 35, points: 7.5 }, // 0:35
      ],
    },
    // Female 45-49
    [AGE_BRACKETS.AGE_45_49]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 990, points: 50.0 }, // 16:30
        { threshold: 1040, points: 49.4 }, // 17:20
        { threshold: 1057, points: 48.8 }, // 17:37
        { threshold: 1072, points: 48.1 }, // 17:52
        { threshold: 1086, points: 47.5 }, // 18:06
        { threshold: 1111, points: 46.9 }, // 18:31
        { threshold: 1122, points: 46.3 }, // 18:42
        { threshold: 1132, points: 45.6 }, // 18:52
        { threshold: 1143, points: 45.0 }, // 19:03
        { threshold: 1172, points: 43.9 }, // 19:32
        { threshold: 1190, points: 42.9 }, // 19:50
        { threshold: 1208, points: 41.8 }, // 20:08
        { threshold: 1226, points: 40.7 }, // 20:26
        { threshold: 1242, points: 39.6 }, // 20:42
        { threshold: 1258, points: 38.6 }, // 20:58
        { threshold: 1274, points: 37.5 }, // 21:14
        { threshold: 1305, points: 35.5 }, // 21:45
        { threshold: 1329, points: 34.0 }, // 22:09
        { threshold: 1355, points: 32.5 }, // 22:35
        { threshold: 1384, points: 31.0 }, // 23:04
        { threshold: 1410, points: 29.5 }, // 23:30
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 68, points: 50.0 },
        { threshold: 62, points: 49.4 },
        { threshold: 59, points: 48.8 },
        { threshold: 56, points: 48.1 },
        { threshold: 54, points: 47.5 },
        { threshold: 51, points: 46.9 },
        { threshold: 48, points: 46.3 },
        { threshold: 45, points: 45.6 },
        { threshold: 42, points: 45.0 },
        { threshold: 39, points: 43.9 },
        { threshold: 36, points: 42.9 },
        { threshold: 33, points: 41.8 },
        { threshold: 30, points: 40.7 },
        { threshold: 27, points: 39.6 },
        { threshold: 24, points: 38.6 },
        { threshold: 22, points: 37.5 },
        { threshold: 19, points: 35.5 },
        { threshold: 16, points: 34.0 },
        { threshold: 14, points: 32.5 },
        { threshold: 12, points: 31.0 },
        { threshold: 10, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 37, points: 15.0 },
        { threshold: 36, points: 14.9 },
        { threshold: 35, points: 14.7 },
        { threshold: 34, points: 14.6 },
        { threshold: 33, points: 14.4 },
        { threshold: 32, points: 14.3 },
        { threshold: 31, points: 14.1 },
        { threshold: 30, points: 14.0 },
        { threshold: 29, points: 13.8 },
        { threshold: 28, points: 13.7 },
        { threshold: 27, points: 13.5 },
        { threshold: 26, points: 13.4 },
        { threshold: 25, points: 13.2 },
        { threshold: 24, points: 13.1 },
        { threshold: 23, points: 12.9 },
        { threshold: 22, points: 12.8 },
        { threshold: 21, points: 12.6 },
        { threshold: 20, points: 12.5 },
        { threshold: 19, points: 12.3 },
        { threshold: 18, points: 12.2 },
        { threshold: 17, points: 12.0 },
        { threshold: 16, points: 11.7 },
        { threshold: 15, points: 11.3 },
        { threshold: 14, points: 10.5 },
        { threshold: 13, points: 9.8 },
        { threshold: 12, points: 9.0 },
        { threshold: 11, points: 8.3 },
        { threshold: 10, points: 7.5 },
        { threshold: 9, points: 5.3 },
        { threshold: 8, points: 3.0 },
        { threshold: 7, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 28, points: 15.0 },
        { threshold: 27, points: 14.7 },
        { threshold: 26, points: 14.4 },
        { threshold: 25, points: 14.1 },
        { threshold: 24, points: 13.8 },
        { threshold: 23, points: 13.5 },
        { threshold: 22, points: 13.2 },
        { threshold: 21, points: 12.9 },
        { threshold: 20, points: 12.6 },
        { threshold: 19, points: 12.3 },
        { threshold: 18, points: 12.0 },
        { threshold: 17, points: 11.7 },
        { threshold: 16, points: 11.4 },
        { threshold: 15, points: 11.1 },
        { threshold: 14, points: 10.8 },
        { threshold: 13, points: 10.5 },
        { threshold: 12, points: 10.2 },
        { threshold: 11, points: 9.9 },
        { threshold: 10, points: 9.6 },
        { threshold: 9, points: 9.3 },
        { threshold: 8, points: 9.0 },
        { threshold: 7, points: 8.7 },
        { threshold: 6, points: 8.4 },
        { threshold: 5, points: 8.1 },
        { threshold: 4, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 35, points: 15.0 },
        { threshold: 34, points: 14.8 },
        { threshold: 33, points: 14.6 },
        { threshold: 32, points: 14.3 },
        { threshold: 31, points: 14.1 },
        { threshold: 30, points: 13.5 },
        { threshold: 29, points: 13.2 },
        { threshold: 28, points: 12.8 },
        { threshold: 27, points: 12.5 },
        { threshold: 26, points: 12.0 },
        { threshold: 25, points: 11.3 },
        { threshold: 24, points: 10.5 },
        { threshold: 23, points: 9.8 },
        { threshold: 22, points: 9.0 },
        { threshold: 21, points: 6.8 },
        { threshold: 20, points: 4.5 },
        { threshold: 19, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 40, points: 15.0 },
        { threshold: 39, points: 14.8 },
        { threshold: 38, points: 14.6 },
        { threshold: 37, points: 14.3 },
        { threshold: 36, points: 14.1 },
        { threshold: 35, points: 13.9 },
        { threshold: 34, points: 13.7 },
        { threshold: 33, points: 13.4 },
        { threshold: 32, points: 13.2 },
        { threshold: 31, points: 13.1 },
        { threshold: 30, points: 12.8 },
        { threshold: 29, points: 12.6 },
        { threshold: 28, points: 12.4 },
        { threshold: 27, points: 12.2 },
        { threshold: 26, points: 11.9 },
        { threshold: 25, points: 11.7 },
        { threshold: 24, points: 11.5 },
        { threshold: 23, points: 11.3 },
        { threshold: 22, points: 11.0 },
        { threshold: 21, points: 10.8 },
        { threshold: 20, points: 10.6 },
        { threshold: 19, points: 10.4 },
        { threshold: 18, points: 10.1 },
        { threshold: 17, points: 9.9 },
        { threshold: 16, points: 9.7 },
        { threshold: 15, points: 9.5 },
        { threshold: 14, points: 9.3 },
        { threshold: 13, points: 9.1 },
        { threshold: 12, points: 8.9 },
        { threshold: 11, points: 8.6 },
        { threshold: 10, points: 8.4 },
        { threshold: 9, points: 8.2 },
        { threshold: 8, points: 8.0 },
        { threshold: 7, points: 7.7 },
        { threshold: 6, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 185, points: 15.0 }, // 3:05
        { threshold: 180, points: 14.8 }, // 3:00
        { threshold: 174, points: 14.5 }, // 2:54
        { threshold: 167, points: 14.1 }, // 2:47
        { threshold: 160, points: 13.8 }, // 2:40
        { threshold: 140, points: 12.8 }, // 2:20
        { threshold: 120, points: 11.9 }, // 2:00
        { threshold: 100, points: 10.9 }, // 1:40
        { threshold: 80, points: 9.9 }, // 1:20
        { threshold: 60, points: 8.9 }, // 1:00
        { threshold: 40, points: 8.0 }, // 0:40
        { threshold: 35, points: 7.7 }, // 0:35
        { threshold: 30, points: 7.5 }, // 0:30
      ],
    },
    // Female 50-54
    [AGE_BRACKETS.AGE_50_54]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1019, points: 50.0 }, // 16:59
        { threshold: 1085, points: 49.4 }, // 18:05
        { threshold: 1102, points: 48.8 }, // 18:22
        { threshold: 1117, points: 48.1 }, // 18:37
        { threshold: 1130, points: 47.5 }, // 18:50
        { threshold: 1155, points: 46.9 }, // 19:15
        { threshold: 1166, points: 46.3 }, // 19:26
        { threshold: 1177, points: 45.6 }, // 19:37
        { threshold: 1187, points: 45.0 }, // 19:47
        { threshold: 1216, points: 43.9 }, // 20:16
        { threshold: 1235, points: 42.9 }, // 20:35
        { threshold: 1253, points: 41.8 }, // 20:53
        { threshold: 1270, points: 40.7 }, // 21:10
        { threshold: 1287, points: 39.6 }, // 21:27
        { threshold: 1303, points: 38.6 }, // 21:43
        { threshold: 1319, points: 37.5 }, // 21:59
        { threshold: 1350, points: 35.5 }, // 22:30
        { threshold: 1374, points: 34.0 }, // 22:54
        { threshold: 1400, points: 32.5 }, // 23:20
        { threshold: 1429, points: 31.0 }, // 23:49
        { threshold: 1440, points: 29.5 }, // 24:00
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 56, points: 50.0 },
        { threshold: 53, points: 49.4 },
        { threshold: 51, points: 48.8 },
        { threshold: 48, points: 48.1 },
        { threshold: 45, points: 47.5 },
        { threshold: 42, points: 46.9 },
        { threshold: 39, points: 46.3 },
        { threshold: 36, points: 45.6 },
        { threshold: 33, points: 45.0 },
        { threshold: 30, points: 43.9 },
        { threshold: 28, points: 42.9 },
        { threshold: 25, points: 41.8 },
        { threshold: 23, points: 40.7 },
        { threshold: 20, points: 39.6 },
        { threshold: 18, points: 38.6 },
        { threshold: 16, points: 37.5 },
        { threshold: 14, points: 35.5 },
        { threshold: 12, points: 34.0 },
        { threshold: 10, points: 32.5 },
        { threshold: 8, points: 31.0 },
        { threshold: 7, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 35, points: 15.0 },
        { threshold: 34, points: 14.9 },
        { threshold: 33, points: 14.7 },
        { threshold: 32, points: 14.6 },
        { threshold: 31, points: 14.4 },
        { threshold: 30, points: 14.3 },
        { threshold: 29, points: 14.1 },
        { threshold: 28, points: 14.0 },
        { threshold: 27, points: 13.8 },
        { threshold: 26, points: 13.7 },
        { threshold: 25, points: 13.5 },
        { threshold: 24, points: 13.2 },
        { threshold: 23, points: 13.1 },
        { threshold: 22, points: 13.0 },
        { threshold: 21, points: 12.9 },
        { threshold: 20, points: 12.8 },
        { threshold: 19, points: 12.6 },
        { threshold: 18, points: 12.5 },
        { threshold: 17, points: 12.3 },
        { threshold: 16, points: 12.2 },
        { threshold: 15, points: 12.0 },
        { threshold: 14, points: 11.3 },
        { threshold: 13, points: 10.5 },
        { threshold: 12, points: 9.8 },
        { threshold: 11, points: 9.0 },
        { threshold: 10, points: 8.3 },
        { threshold: 9, points: 7.5 },
        { threshold: 8, points: 5.3 },
        { threshold: 7, points: 3.0 },
        { threshold: 6, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 25, points: 15.0 },
        { threshold: 24, points: 14.7 },
        { threshold: 23, points: 14.4 },
        { threshold: 22, points: 14.1 },
        { threshold: 21, points: 13.8 },
        { threshold: 20, points: 13.5 },
        { threshold: 19, points: 13.2 },
        { threshold: 18, points: 12.9 },
        { threshold: 17, points: 12.6 },
        { threshold: 16, points: 12.3 },
        { threshold: 15, points: 12.0 },
        { threshold: 14, points: 11.7 },
        { threshold: 13, points: 11.4 },
        { threshold: 12, points: 11.1 },
        { threshold: 11, points: 10.8 },
        { threshold: 10, points: 10.5 },
        { threshold: 9, points: 10.2 },
        { threshold: 8, points: 9.9 },
        { threshold: 7, points: 9.6 },
        { threshold: 6, points: 9.3 },
        { threshold: 5, points: 9.0 },
        { threshold: 4, points: 8.7 },
        { threshold: 3, points: 8.4 },
        { threshold: 2, points: 8.1 },
        { threshold: 1, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 32, points: 15.0 },
        { threshold: 31, points: 14.6 },
        { threshold: 30, points: 14.3 },
        { threshold: 29, points: 13.5 },
        { threshold: 28, points: 13.4 },
        { threshold: 27, points: 13.2 },
        { threshold: 26, points: 12.9 },
        { threshold: 25, points: 12.8 },
        { threshold: 24, points: 12.0 },
        { threshold: 23, points: 11.3 },
        { threshold: 22, points: 10.5 },
        { threshold: 21, points: 9.8 },
        { threshold: 20, points: 9.0 },
        { threshold: 19, points: 6.8 },
        { threshold: 18, points: 4.5 },
        { threshold: 17, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 39, points: 15.0 },
        { threshold: 38, points: 14.8 },
        { threshold: 37, points: 14.6 },
        { threshold: 36, points: 14.3 },
        { threshold: 35, points: 14.1 },
        { threshold: 34, points: 13.9 },
        { threshold: 33, points: 13.7 },
        { threshold: 32, points: 13.4 },
        { threshold: 31, points: 13.2 },
        { threshold: 30, points: 13.0 },
        { threshold: 29, points: 12.8 },
        { threshold: 28, points: 12.5 },
        { threshold: 27, points: 12.3 },
        { threshold: 26, points: 12.1 },
        { threshold: 25, points: 11.9 },
        { threshold: 24, points: 11.6 },
        { threshold: 23, points: 11.4 },
        { threshold: 22, points: 11.1 },
        { threshold: 21, points: 10.9 },
        { threshold: 20, points: 10.7 },
        { threshold: 19, points: 10.4 },
        { threshold: 18, points: 10.2 },
        { threshold: 17, points: 10.0 },
        { threshold: 16, points: 9.8 },
        { threshold: 15, points: 9.5 },
        { threshold: 14, points: 9.3 },
        { threshold: 13, points: 9.1 },
        { threshold: 12, points: 8.9 },
        { threshold: 11, points: 8.6 },
        { threshold: 10, points: 8.4 },
        { threshold: 9, points: 8.2 },
        { threshold: 8, points: 8.0 },
        { threshold: 7, points: 7.7 },
        { threshold: 6, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 180, points: 15.0 }, // 3:00
        { threshold: 175, points: 14.8 }, // 2:55
        { threshold: 169, points: 14.5 }, // 2:49
        { threshold: 162, points: 14.1 }, // 2:42
        { threshold: 155, points: 13.8 }, // 2:35
        { threshold: 135, points: 12.8 }, // 2:15
        { threshold: 115, points: 11.9 }, // 1:55
        { threshold: 95, points: 10.9 }, // 1:35
        { threshold: 75, points: 9.9 }, // 1:15
        { threshold: 55, points: 8.9 }, // 0:55
        { threshold: 35, points: 8.0 }, // 0:35
        { threshold: 30, points: 7.7 }, // 0:30
        { threshold: 25, points: 7.5 }, // 0:25
      ],
    },
    // Female 55-59
    [AGE_BRACKETS.AGE_55_59]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1038, points: 50.0 }, // 17:18
        { threshold: 1076, points: 49.4 }, // 17:56
        { threshold: 1080, points: 48.8 }, // 18:00
        { threshold: 1105, points: 48.1 }, // 18:25
        { threshold: 1111, points: 47.5 }, // 18:31
        { threshold: 1126, points: 46.9 }, // 18:46
        { threshold: 1128, points: 46.3 }, // 18:48
        { threshold: 1136, points: 45.6 }, // 18:56
        { threshold: 1139, points: 45.0 }, // 18:59
        { threshold: 1169, points: 43.9 }, // 19:29
        { threshold: 1185, points: 42.9 }, // 19:45
        { threshold: 1202, points: 41.8 }, // 20:02
        { threshold: 1217, points: 40.7 }, // 20:17
        { threshold: 1231, points: 39.6 }, // 20:31
        { threshold: 1243, points: 38.6 }, // 20:43
        { threshold: 1244, points: 37.5 }, // 20:44
        { threshold: 1292, points: 35.5 }, // 21:32
        { threshold: 1319, points: 34.0 }, // 21:59
        { threshold: 1353, points: 32.5 }, // 22:33
        { threshold: 1402, points: 31.0 }, // 23:22
        { threshold: 1488, points: 29.5 }, // 24:48
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 54, points: 50.0 },
        { threshold: 51, points: 49.4 },
        { threshold: 49, points: 48.8 },
        { threshold: 46, points: 48.1 },
        { threshold: 43, points: 47.5 },
        { threshold: 40, points: 46.9 },
        { threshold: 37, points: 46.3 },
        { threshold: 34, points: 45.6 },
        { threshold: 31, points: 45.0 },
        { threshold: 28, points: 43.9 },
        { threshold: 26, points: 42.9 },
        { threshold: 23, points: 41.8 },
        { threshold: 21, points: 40.7 },
        { threshold: 18, points: 39.6 },
        { threshold: 16, points: 38.6 },
        { threshold: 14, points: 37.5 },
        { threshold: 12, points: 35.5 },
        { threshold: 10, points: 34.0 },
        { threshold: 8, points: 32.5 },
        { threshold: 6, points: 31.0 },
        { threshold: 5, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 28, points: 15.0 },
        { threshold: 27, points: 14.8 },
        { threshold: 26, points: 14.6 },
        { threshold: 25, points: 14.4 },
        { threshold: 24, points: 14.3 },
        { threshold: 23, points: 14.0 },
        { threshold: 22, points: 13.5 },
        { threshold: 21, points: 13.2 },
        { threshold: 20, points: 12.9 },
        { threshold: 19, points: 12.8 },
        { threshold: 18, points: 12.6 },
        { threshold: 17, points: 12.5 },
        { threshold: 16, points: 12.3 },
        { threshold: 15, points: 12.2 },
        { threshold: 14, points: 12.0 },
        { threshold: 13, points: 11.3 },
        { threshold: 12, points: 10.5 },
        { threshold: 11, points: 9.8 },
        { threshold: 10, points: 9.0 },
        { threshold: 9, points: 8.3 },
        { threshold: 8, points: 7.5 },
        { threshold: 7, points: 5.3 },
        { threshold: 6, points: 3.0 },
        { threshold: 5, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 25, points: 15.0 },
        { threshold: 24, points: 14.7 },
        { threshold: 23, points: 14.4 },
        { threshold: 22, points: 14.1 },
        { threshold: 21, points: 13.8 },
        { threshold: 20, points: 13.5 },
        { threshold: 19, points: 13.2 },
        { threshold: 18, points: 12.9 },
        { threshold: 17, points: 12.6 },
        { threshold: 16, points: 12.3 },
        { threshold: 15, points: 12.0 },
        { threshold: 14, points: 11.7 },
        { threshold: 13, points: 11.4 },
        { threshold: 12, points: 11.1 },
        { threshold: 11, points: 10.8 },
        { threshold: 10, points: 10.5 },
        { threshold: 9, points: 10.2 },
        { threshold: 8, points: 9.9 },
        { threshold: 7, points: 9.6 },
        { threshold: 6, points: 9.3 },
        { threshold: 5, points: 9.0 },
        { threshold: 4, points: 8.7 },
        { threshold: 3, points: 8.4 },
        { threshold: 2, points: 8.1 },
        { threshold: 1, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 32, points: 15.0 },
        { threshold: 31, points: 14.8 },
        { threshold: 30, points: 14.6 },
        { threshold: 29, points: 14.4 },
        { threshold: 28, points: 14.3 },
        { threshold: 27, points: 13.5 },
        { threshold: 26, points: 13.4 },
        { threshold: 25, points: 13.2 },
        { threshold: 24, points: 12.9 },
        { threshold: 23, points: 12.8 },
        { threshold: 22, points: 12.0 },
        { threshold: 21, points: 11.3 },
        { threshold: 20, points: 11.0 },
        { threshold: 19, points: 10.5 },
        { threshold: 18, points: 10.2 },
        { threshold: 17, points: 9.8 },
        { threshold: 16, points: 9.5 },
        { threshold: 15, points: 9.0 },
        { threshold: 14, points: 6.8 },
        { threshold: 13, points: 4.5 },
        { threshold: 12, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 38, points: 15.0 },
        { threshold: 37, points: 14.8 },
        { threshold: 36, points: 14.6 },
        { threshold: 35, points: 14.3 },
        { threshold: 34, points: 14.1 },
        { threshold: 33, points: 13.8 },
        { threshold: 32, points: 13.6 },
        { threshold: 31, points: 13.4 },
        { threshold: 30, points: 13.1 },
        { threshold: 29, points: 12.9 },
        { threshold: 28, points: 12.7 },
        { threshold: 27, points: 12.5 },
        { threshold: 26, points: 12.2 },
        { threshold: 25, points: 11.9 },
        { threshold: 24, points: 11.7 },
        { threshold: 23, points: 11.5 },
        { threshold: 22, points: 11.3 },
        { threshold: 21, points: 11.0 },
        { threshold: 20, points: 10.8 },
        { threshold: 19, points: 10.6 },
        { threshold: 18, points: 10.4 },
        { threshold: 17, points: 10.1 },
        { threshold: 16, points: 9.8 },
        { threshold: 15, points: 9.6 },
        { threshold: 14, points: 9.4 },
        { threshold: 13, points: 9.2 },
        { threshold: 12, points: 8.9 },
        { threshold: 11, points: 8.7 },
        { threshold: 10, points: 8.5 },
        { threshold: 9, points: 8.2 },
        { threshold: 8, points: 8.0 },
        { threshold: 7, points: 7.7 },
        { threshold: 6, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 175, points: 15.0 }, // 2:55
        { threshold: 170, points: 14.8 }, // 2:50
        { threshold: 164, points: 14.5 }, // 2:44
        { threshold: 157, points: 14.1 }, // 2:37
        { threshold: 150, points: 13.8 }, // 2:30
        { threshold: 130, points: 12.8 }, // 2:10
        { threshold: 110, points: 11.9 }, // 1:50
        { threshold: 90, points: 10.9 }, // 1:30
        { threshold: 70, points: 9.9 }, // 1:10
        { threshold: 50, points: 8.9 }, // 0:50
        { threshold: 30, points: 8.0 }, // 0:30
        { threshold: 25, points: 7.7 }, // 0:25
        { threshold: 20, points: 7.5 }, // 0:20
      ],
    },
    // Female 60+
    [AGE_BRACKETS.AGE_60_PLUS]: {
      // 2-mile run (cardio, 50 pts max) - time in seconds
      [EXERCISES.RUN_2MILE]: [
        { threshold: 1038, points: 50.0 }, // 17:18
        { threshold: 1076, points: 49.4 }, // 17:56
        { threshold: 1080, points: 48.8 }, // 18:00
        { threshold: 1105, points: 48.1 }, // 18:25
        { threshold: 1111, points: 47.5 }, // 18:31
        { threshold: 1126, points: 46.9 }, // 18:46
        { threshold: 1128, points: 46.3 }, // 18:48
        { threshold: 1136, points: 45.6 }, // 18:56
        { threshold: 1139, points: 45.0 }, // 18:59
        { threshold: 1169, points: 43.9 }, // 19:29
        { threshold: 1185, points: 42.9 }, // 19:45
        { threshold: 1202, points: 41.8 }, // 20:02
        { threshold: 1217, points: 40.7 }, // 20:17
        { threshold: 1231, points: 39.6 }, // 20:31
        { threshold: 1243, points: 38.6 }, // 20:43
        { threshold: 1244, points: 37.5 }, // 20:44
        { threshold: 1292, points: 35.5 }, // 21:32
        { threshold: 1322, points: 34.0 }, // 22:02
        { threshold: 1364, points: 32.5 }, // 22:44
        { threshold: 1402, points: 31.0 }, // 23:22
        { threshold: 1500, points: 29.5 }, // 25:00
      ],
      // HAMR Shuttle (cardio, 50 pts max) - shuttles completed
      [EXERCISES.HAMR]: [
        { threshold: 48, points: 50.0 },
        { threshold: 45, points: 49.4 },
        { threshold: 43, points: 48.8 },
        { threshold: 40, points: 48.1 },
        { threshold: 38, points: 47.5 },
        { threshold: 36, points: 46.9 },
        { threshold: 34, points: 46.3 },
        { threshold: 32, points: 45.6 },
        { threshold: 30, points: 45.0 },
        { threshold: 28, points: 43.9 },
        { threshold: 26, points: 42.9 },
        { threshold: 23, points: 41.8 },
        { threshold: 21, points: 40.7 },
        { threshold: 18, points: 39.6 },
        { threshold: 15, points: 38.6 },
        { threshold: 12, points: 37.5 },
        { threshold: 10, points: 35.5 },
        { threshold: 8, points: 34.0 },
        { threshold: 6, points: 32.5 },
        { threshold: 4, points: 31.0 },
        { threshold: 2, points: 29.5 },
      ],
      // Push-ups (strength, 15 pts max) - reps in 1 min
      [EXERCISES.PUSHUPS]: [
        { threshold: 21, points: 15.0 },
        { threshold: 20, points: 14.6 },
        { threshold: 19, points: 14.3 },
        { threshold: 18, points: 14.1 },
        { threshold: 17, points: 13.5 },
        { threshold: 16, points: 13.2 },
        { threshold: 15, points: 12.8 },
        { threshold: 14, points: 12.0 },
        { threshold: 13, points: 11.3 },
        { threshold: 12, points: 10.5 },
        { threshold: 11, points: 9.8 },
        { threshold: 10, points: 9.0 },
        { threshold: 9, points: 8.6 },
        { threshold: 8, points: 8.0 },
        { threshold: 7, points: 7.5 },
        { threshold: 6, points: 5.3 },
        { threshold: 5, points: 3.0 },
        { threshold: 4, points: 0.8 },
      ],
      // Hand-Release Push-ups (strength, 15 pts max) - reps in 2 min
      [EXERCISES.HRPU]: [
        { threshold: 24, points: 15.0 },
        { threshold: 23, points: 14.7 },
        { threshold: 22, points: 14.4 },
        { threshold: 21, points: 14.1 },
        { threshold: 20, points: 13.8 },
        { threshold: 19, points: 13.5 },
        { threshold: 18, points: 13.2 },
        { threshold: 17, points: 12.9 },
        { threshold: 16, points: 12.6 },
        { threshold: 15, points: 12.3 },
        { threshold: 14, points: 12.0 },
        { threshold: 13, points: 11.7 },
        { threshold: 12, points: 11.4 },
        { threshold: 11, points: 11.1 },
        { threshold: 10, points: 10.8 },
        { threshold: 9, points: 10.5 },
        { threshold: 8, points: 10.2 },
        { threshold: 7, points: 9.9 },
        { threshold: 6, points: 9.6 },
        { threshold: 5, points: 9.3 },
        { threshold: 4, points: 9.0 },
        { threshold: 3, points: 8.7 },
        { threshold: 2, points: 8.4 },
        { threshold: 1, points: 7.5 },
      ],
      // Sit-ups (core, 15 pts max) - reps in 1 min
      [EXERCISES.SITUPS]: [
        { threshold: 31, points: 15.0 },
        { threshold: 30, points: 14.8 },
        { threshold: 29, points: 14.6 },
        { threshold: 28, points: 14.3 },
        { threshold: 27, points: 14.1 },
        { threshold: 26, points: 13.5 },
        { threshold: 25, points: 13.4 },
        { threshold: 24, points: 13.2 },
        { threshold: 23, points: 13.1 },
        { threshold: 22, points: 12.9 },
        { threshold: 21, points: 12.8 },
        { threshold: 20, points: 12.6 },
        { threshold: 19, points: 12.5 },
        { threshold: 18, points: 12.3 },
        { threshold: 17, points: 12.0 },
        { threshold: 16, points: 11.7 },
        { threshold: 15, points: 11.3 },
        { threshold: 14, points: 11.0 },
        { threshold: 13, points: 10.5 },
        { threshold: 12, points: 9.8 },
        { threshold: 11, points: 9.0 },
        { threshold: 10, points: 6.8 },
        { threshold: 9, points: 4.5 },
        { threshold: 8, points: 2.3 },
      ],
      // Cross-Leg Reverse Crunches (core, 15 pts max) - reps in 2 min
      [EXERCISES.CLRC]: [
        { threshold: 32, points: 15.0 },
        { threshold: 31, points: 14.7 },
        { threshold: 30, points: 14.5 },
        { threshold: 29, points: 14.2 },
        { threshold: 28, points: 13.9 },
        { threshold: 27, points: 13.6 },
        { threshold: 26, points: 13.4 },
        { threshold: 25, points: 13.1 },
        { threshold: 24, points: 12.8 },
        { threshold: 23, points: 12.5 },
        { threshold: 22, points: 12.2 },
        { threshold: 21, points: 11.9 },
        { threshold: 20, points: 11.7 },
        { threshold: 19, points: 11.4 },
        { threshold: 18, points: 11.1 },
        { threshold: 17, points: 10.8 },
        { threshold: 16, points: 10.6 },
        { threshold: 15, points: 10.3 },
        { threshold: 14, points: 10.0 },
        { threshold: 13, points: 9.8 },
        { threshold: 12, points: 9.5 },
        { threshold: 11, points: 9.2 },
        { threshold: 10, points: 8.9 },
        { threshold: 9, points: 8.6 },
        { threshold: 8, points: 8.3 },
        { threshold: 7, points: 8.0 },
        { threshold: 6, points: 7.8 },
        { threshold: 5, points: 7.5 },
      ],
      // Forearm Plank (core, 15 pts max) - time in seconds
      [EXERCISES.PLANK]: [
        { threshold: 170, points: 15.0 }, // 2:50
        { threshold: 165, points: 14.8 }, // 2:45
        { threshold: 159, points: 14.5 }, // 2:39
        { threshold: 152, points: 14.1 }, // 2:32
        { threshold: 145, points: 13.8 }, // 2:25
        { threshold: 125, points: 12.8 }, // 2:05
        { threshold: 105, points: 11.9 }, // 1:45
        { threshold: 85, points: 10.9 }, // 1:25
        { threshold: 65, points: 9.9 }, // 1:05
        { threshold: 30, points: 8.3 }, // 0:30
        { threshold: 25, points: 8.0 }, // 0:25
        { threshold: 20, points: 7.7 }, // 0:20
        { threshold: 15, points: 7.5 }, // 0:15
      ],
    },
  },
}

// WHtR is universal (not age/gender specific)
// Source: Official AFPC 50-20-15-15 Charts (23 Sep 2025)
export const WHTR_TABLE = [
  { threshold: 0.49, points: 20.0 }, // Low Risk
  { threshold: 0.5, points: 19.0 }, // Moderate Risk
  { threshold: 0.51, points: 18.0 }, // Moderate Risk
  { threshold: 0.52, points: 17.0 }, // Moderate Risk
  { threshold: 0.53, points: 16.0 }, // Moderate Risk
  { threshold: 0.54, points: 15.0 }, // Moderate Risk
  { threshold: 0.55, points: 12.5 }, // High Risk
  { threshold: 0.56, points: 10.0 }, // High Risk
  { threshold: 0.57, points: 7.5 }, // High Risk
  { threshold: 0.58, points: 5.0 }, // High Risk
  { threshold: 0.59, points: 2.5 }, // High Risk
  { threshold: 0.6, points: 0.0 }, // High Risk
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
