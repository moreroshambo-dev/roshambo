import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { deposits } from "./deposits/tonPay/httpRoutes";

const http = httpRouter();

deposits.addHttpRoutes(http)
auth.addHttpRoutes(http);

export default http;