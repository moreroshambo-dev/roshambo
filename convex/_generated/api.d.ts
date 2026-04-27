/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as deposits_tonPay_httpRoutes from "../deposits/tonPay/httpRoutes.js";
import type * as deposits_tonPay_index from "../deposits/tonPay/index.js";
import type * as deposits_tonPay_internal from "../deposits/tonPay/internal.js";
import type * as deposits_tonPay_payload from "../deposits/tonPay/payload.js";
import type * as deposits_tonPay_signature from "../deposits/tonPay/signature.js";
import type * as game_rcp_autoSelect from "../game/rcp/autoSelect.js";
import type * as game_rcp_history from "../game/rcp/history.js";
import type * as game_rcp_libs_match from "../game/rcp/libs/match.js";
import type * as game_rcp_libs_room from "../game/rcp/libs/room.js";
import type * as game_rcp_libs_rps from "../game/rcp/libs/rps.js";
import type * as game_rcp_match from "../game/rcp/match.js";
import type * as game_rcp_room from "../game/rcp/room.js";
import type * as game_rcp_settings from "../game/rcp/settings.js";
import type * as http from "../http.js";
import type * as libs_auth from "../libs/auth.js";
import type * as libs_balances from "../libs/balances.js";
import type * as matches from "../matches.js";
import type * as signals from "../signals.js";
import type * as telegram from "../telegram.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "deposits/tonPay/httpRoutes": typeof deposits_tonPay_httpRoutes;
  "deposits/tonPay/index": typeof deposits_tonPay_index;
  "deposits/tonPay/internal": typeof deposits_tonPay_internal;
  "deposits/tonPay/payload": typeof deposits_tonPay_payload;
  "deposits/tonPay/signature": typeof deposits_tonPay_signature;
  "game/rcp/autoSelect": typeof game_rcp_autoSelect;
  "game/rcp/history": typeof game_rcp_history;
  "game/rcp/libs/match": typeof game_rcp_libs_match;
  "game/rcp/libs/room": typeof game_rcp_libs_room;
  "game/rcp/libs/rps": typeof game_rcp_libs_rps;
  "game/rcp/match": typeof game_rcp_match;
  "game/rcp/room": typeof game_rcp_room;
  "game/rcp/settings": typeof game_rcp_settings;
  http: typeof http;
  "libs/auth": typeof libs_auth;
  "libs/balances": typeof libs_balances;
  matches: typeof matches;
  signals: typeof signals;
  telegram: typeof telegram;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
