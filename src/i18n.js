import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them)

const options = {
	// order and from where user language should be detected
	order: [
		"cookie",
		"htmlTag",
		"querystring",
		"localStorage",
		"sessionStorage",
		"navigator",
		"path",
		"subdomain"
	],

	// cache user language on
	// caches: ["localStorage", "cookie"],
	caches: ["cookie"],

	// optional htmlTag with lang attribute, the default is:
	htmlTag: document.documentElement,

	// optional set cookie options, reference:[MDN Set-Cookie docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
	cookieOptions: { path: "/", sameSite: "strict" }
};

i18n
	.use(initReactI18next) // passes i18n down to react-i18next
	.use(LanguageDetector)
	.use(HttpApi)
	.init({
		// resources,
		// lng: document.querySelector("html").lang,
		// fallbackLng: "en",
		supportedLngs: ["ar", "en"],
		detection: options,
		backend: {
			loadPath: "/assets/locales/{{lng}}/translation.json"
		},
		// keySeparator: false, // we do not use keys in form messages.welcome
		// react: {
		// 	useSuspense: false
		// },
		interpolation: {
			escapeValue: false // react already safes from xss
		}
	});

export default i18n;
