import { defineMiddleware } from "astro:middleware";
import { userFromSession } from "@/lib/auth";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.user = userFromSession(context.cookies);

  const path = context.url.pathname;
  const needsLogin = path === "/manage" || path.startsWith("/manage/") || path === "/admin" || path.startsWith("/admin/");
  if (needsLogin && !context.locals.user) {
    return context.redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  if ((path === "/admin" || path.startsWith("/admin/")) && !context.locals.user?.isAdmin) {
    return new Response("Only admins can see this page.", { status: 403 });
  }

  return next();
});
