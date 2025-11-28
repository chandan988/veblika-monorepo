import { nanoid } from "nanoid";

let currentPopup: Window | null = null;

export const oauth2Utils = {
  openOAuth2Popup,
  openWithLoginUrl,
  openWithLoginUrlAndGetAllParams
};

/**
 * Opens the OAuth2 login URL in a new popup and retrieves the authorization code.
 * @param {string} loginUrl - The URL to initiate the OAuth2 flow.
 * @param {string} redirectUrl - The URL to which OAuth2 provider will redirect after login.
 * @returns {Promise<{code: string, codeChallenge?: string}>}
 */
async function openWithLoginUrl(loginUrl: string, redirectUrl: string): Promise<{ code: string; codeChallenge?: string }> {
  try {
    currentPopup = openWindow(loginUrl);
    if (!currentPopup) throw new Error("Failed to open popup window");

    return {
      code: await getCode(redirectUrl),
      codeChallenge: undefined,
    };
  } catch (error) {
    console.error("Error during OAuth2 login", error);
    throw error;
  }
}

/**
 * Opens the OAuth2 login URL in a popup and retrieves all search parameters.
 * @param {string} loginUrl - The URL to initiate the OAuth2 flow.
 * @param {string} redirectUrl - The URL to which OAuth2 provider will redirect after login.
 * @returns {Promise<Record<string, string>>} All search parameters returned from the OAuth2 provider
 */
async function openWithLoginUrlAndGetAllParams(loginUrl: string, redirectUrl: string): Promise<Record<string, string>> {
  try {
    closeOAuth2Popup(); // Close any existing popup before opening a new one

    currentPopup = openWindow(loginUrl);
    if (!currentPopup) throw new Error("Failed to open popup window");

    return await getAllParams(redirectUrl);
  } catch (error) {
    console.error("Error during OAuth2 login", error);
    throw error;
  }
}

/**
 * Opens the OAuth2 login URL with PKCE challenge if required.
 * @param {OAuth2PopupParams} params - OAuth2 popup parameters including PKCE.
 * @returns {Promise<OAuth2PopupResponse>}
 */
async function openOAuth2Popup(params: OAuth2PopupParams): Promise<OAuth2PopupResponse> {
  try {
    closeOAuth2Popup(); // Close any existing popup before opening a new one

    const pkceChallenge = params.pkce ? nanoid() : undefined;
    const url = constructUrl(params, pkceChallenge);

    currentPopup = openWindow(url);
    if (!currentPopup) throw new Error("Failed to open popup window");

    return {
      code: await getCode(params.redirectUrl),
      codeChallenge: pkceChallenge,
    };
  } catch (error) {
    console.error("OAuth2 popup error", error);
    throw error;
  }
}

/**
 * Opens a new window with given features.
 * @param {string} url - The URL to open in the new window.
 * @returns {Window | null}
 */
function openWindow(url: string): Window | null {
  const winFeatures = [
    "resizable=no",
    "toolbar=no",
    "left=100",
    "top=100",
    "scrollbars=no",
    "menubar=no",
    "status=no",
    "directories=no",
    "location=no",
    "width=600",
    "height=800",
  ].join(", ");
  return window.open(url, "_blank", winFeatures);
}

/**
 * Closes the currently open popup window, if any.
 */
function closeOAuth2Popup() {
  if (currentPopup) {
    currentPopup.close();
    currentPopup = null;
  }
}

/**
 * Constructs the OAuth2 URL with query parameters.
 * @param {OAuth2PopupParams} params - OAuth2 parameters to construct the URL.
 * @param {string} [pkceChallenge] - Optional PKCE challenge.
 * @returns {string}
 */
function constructUrl(params: OAuth2PopupParams, pkceChallenge?: string): string {
  const queryParams: Record<string, string> = {
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUrl,
    state: nanoid(),
    scope: params.scope,
    ...(params.extraParams || {}),
  };

  if (params.pkce && pkceChallenge) {
    queryParams["code_challenge_method"] = "plain";
    queryParams["code_challenge"] = pkceChallenge;
  }

  const url = new URL(params.authUrl);
  Object.entries(queryParams).forEach(([key, value]) => {
    if (typeof value === "object") {
      url.searchParams.append(key, JSON.stringify(value));
    } else {
      url.searchParams.append(key, value);
    }
  });

  return url.toString();
}

/**
 * Listens for the authorization code from the popup window via message event.
 * @param {string} redirectUrl - The expected redirect URL.
 * @returns {Promise<string>}
 */
function getCode(redirectUrl: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      if (redirectUrl && redirectUrl.startsWith(event.origin) && event.data["code"]) {
        resolve(decodeURIComponent(event.data.code));
        closeOAuth2Popup();
        window.removeEventListener("message", handler);
      }
    };

    window.addEventListener("message", handler);

    // // Timeout in case no response is received (e.g., popup is closed by user)
    // setTimeout(() => {
    //   window.removeEventListener("message", handler);
    //   reject(new Error("OAuth2 code not received in time"));
    // }, 60000); // Timeout after 60 seconds
  });
}

/**
 * Listens for all search parameters from the popup window via message event.
 * @param {string} redirectUrl - The expected redirect URL.
 * @returns {Promise<Record<string, string>>}
 */
function getAllParams(redirectUrl: string): Promise<Record<string, string>> {
  return new Promise<Record<string, string>>((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      if (redirectUrl && redirectUrl.startsWith(event.origin) && event.data) {
        resolve(event.data);
        closeOAuth2Popup();
        window.removeEventListener("message", handler);
      }
    };

    window.addEventListener("message", handler);
  });
}

/**
 * Parameters required for opening an OAuth2 popup.
 */
type OAuth2PopupParams = {
  authUrl: string;
  clientId: string;
  redirectUrl: string;
  scope: string;
  pkce: boolean;
  extraParams?: Record<string, string>;
};

/**
 * Response from the OAuth2 popup, containing the authorization code and PKCE challenge (if applicable).
 */
type OAuth2PopupResponse = {
  code: string;
  codeChallenge: string | undefined;
};
