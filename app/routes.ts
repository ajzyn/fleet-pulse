import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

export default [
  route(".well-known/appspecific/com.chrome.devtools.json", "./routes/well-known/devtools.tsx"),
  layout("./app-layout.tsx", [
    index("./routes/dashboard/route.tsx"),
    ...prefix("vehicles", [
      index("./routes/vehicles/list.tsx"),
      route(":id", "./routes/vehicles/details.tsx"),
    ]),
    ...prefix("drivers", [index("./routes/drivers/list.tsx")]),
    route("costs", "./routes/costs/route.tsx"),
    route("maintenance", "./routes/maintenance/route.tsx"),
  ]),
] satisfies RouteConfig;
