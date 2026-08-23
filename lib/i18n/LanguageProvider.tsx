"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  messages,
  type Language,
  type Messages,
} from "./messages";

type LanguageContextValue = {
  language: Language;
  messages: Messages;
  setLanguage: (
    language: Language
  ) => void;
  toggleLanguage: () => void;
};

const LanguageContext =
  createContext<
    LanguageContextValue | undefined
  >(undefined);

const STORAGE_KEY =
  "padiata-language";

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    language,
    setLanguageState,
  ] = useState<Language>("es");

  useEffect(() => {
    const storedLanguage =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      storedLanguage === "es" ||
      storedLanguage === "en"
    ) {
      setLanguageState(
        storedLanguage
      );
    }
  }, []);

  function setLanguage(
    nextLanguage: Language
  ) {
    setLanguageState(
      nextLanguage
    );

    window.localStorage.setItem(
      STORAGE_KEY,
      nextLanguage
    );
  }

  function toggleLanguage() {
    setLanguage(
      language === "es"
        ? "en"
        : "es"
    );
  }

  const value =
    useMemo<
      LanguageContextValue
    >(
      () => ({
        language,

        messages:
          messages[language],

        setLanguage,

        toggleLanguage,
      }),
      [language]
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext
    );

  if (!context) {
    throw new Error(
      "useLanguage debe utilizarse dentro de LanguageProvider."
    );
  }

  return context;
}