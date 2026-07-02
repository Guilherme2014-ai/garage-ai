"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { isMetaPixelEnabled, META_PIXEL_ID } from "./config";

/**
 * Loads the Meta (Facebook) Pixel base code once for the whole app and tracks a
 * `PageView` on every client-side navigation.
 *
 * Mounted in the root layout. Renders nothing (and injects no script) until
 * `NEXT_PUBLIC_META_PIXEL_ID` is set, so it's safe to ship before you have a
 * pixel. The inline base snippet defines `window.fbq` (which queues calls until
 * `fbevents.js` finishes loading) and fires the initial `PageView`; the App
 * Router's soft navigations don't reload the page, so we fire subsequent
 * `PageView`s ourselves on pathname changes.
 */
export function MetaPixel() {
  const pathname = usePathname();
  // The base snippet already fires the first PageView, so skip the mount fire
  // and only track genuine route changes after it.
  const initialLoad = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the intended trigger, not a value read in the body — we re-fire PageView on every route change.
  useEffect(() => {
    if (!isMetaPixelEnabled) return;
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!isMetaPixelEnabled) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      {/* Fallback for users with JavaScript disabled. */}
      <noscript>
        {/* biome-ignore lint/performance/noImgElement: Meta's required 1x1 tracking beacon; next/image can't emit this and it can't run in <noscript>. */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
