export const PLACEHOLDER_DIFF = `diff --git a/src/U.java b/src/U.java
--- a/src/U.java
+++ b/src/U.java
@@ -1 +1 @@
-return u.getId().toString();
+return u != null ? String.valueOf(u.getId()) : "";`;

export const DEFAULT_COMMIT = "Fix NPE when user is null";
