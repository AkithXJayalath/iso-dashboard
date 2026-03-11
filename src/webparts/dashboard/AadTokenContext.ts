import * as React from "react";

/**
 * Provides a callback that returns an Azure AD Bearer token for
 * https://graph.microsoft.com, injected once at the web-part root by
 * DashboardWebPart.ts using aadTokenProviderFactory.
 *
 * Consuming hooks call useContext(AadTokenContext) and invoke the function to
 * get a fresh token before each write operation.
 */
export const AadTokenContext = React.createContext<
  (() => Promise<string>) | undefined
>(undefined);
