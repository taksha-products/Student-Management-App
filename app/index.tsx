import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import { BrandSplash } from "../components/ui/BrandSplash";
import { useAuth } from "../contexts/AuthContext";

/** Keep the loading screen up at least this long so it doesn't just flash. */
const MIN_SPLASH_MS = 1400;

export default function Index() {
  const { user, bootstrapping } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  if (bootstrapping || !minElapsed) {
    return <BrandSplash />;
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
