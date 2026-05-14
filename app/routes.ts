import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  route(".well-known/appspecific/com.chrome.devtools.json", "./routes/well-known/devtools.tsx"),
  layout("./app-layout.tsx", [
    index("./routes/dashboard/route.tsx"),
    ...prefix("vehicles", [index("./routes/vehicles/list.tsx")]),
  ]),
] satisfies RouteConfig;
