// src/constants.ts

export type NoticeInlinePart =
  | string
  | { type: 'link'; href: string; label: string; external?: boolean };

export type NoticeItem = string | NoticeInlinePart[];

export const NOTICES: NoticeItem[] = [
  [
    'The sequence classification model has only been trained on the',
    { type: 'link', href: 'https://dl.acm.org/doi/abs/10.1145/3524842.3527996', label: 'ApacheJIT', external: true },
    'dataset.',
  ],
  'The explainability feature is experimental and only works on very small commits.',
];

export const OWNER_REPO_1 = 'facebook/react';
export const COMMIT_SHA_1 = '16ff29d2780784ce51f5e66edf08cee9785444cc';

export const DEFAULT_DIFF_1 = `diff --git a/src/U.java b/src/U.java
index e69de29..4b825dc 100644
--- a/src/U.java
+++ b/src/U.java
@@ -1 +1 @@
-return u.getId().toString();
+return u != null ? String.valueOf(u.getId()) : "";
`;

export const DEFAULT_COMMIT_1 = `Fix NPE when user is null`;

export const WEBSITE_REPO_URL = 'https://github.com/Ali-Sayed-Salehi/drs-llm';
export const FINETUNE_RESEARCH_URL = 'https://github.com/Ali-Sayed-Salehi/jit-dp-llm';
export const CONTACT_EMAIL = 'a.sayedsalehi@mail.concordia.ca';
export const COLLAB_EMAILS = ['peter.rigby@concordia.ca', 'audris@utk.edu'];
export const YOUTUBE_DEMO_URL = 'https://youtu.be/2FzeRRdNaco';

const CONSTANTS = {
  NOTICES,
  OWNER_REPO_1,
  COMMIT_SHA_1,
  DEFAULT_DIFF_1,
  DEFAULT_COMMIT_1,
  WEBSITE_REPO_URL,
  FINETUNE_RESEARCH_URL,
  CONTACT_EMAIL,
  COLLAB_EMAILS,
  YOUTUBE_DEMO_URL,
};
export default CONSTANTS;
