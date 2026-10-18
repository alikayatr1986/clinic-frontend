import { routing } from "./routing";
import enMessages from "../../messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof enMessages;
  }
}
