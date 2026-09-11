const DEFAULT_BASE_URL = "https://m2mcenter.app/apiclient/v1";

function cleanBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).trim().replace(/\/+$/, "");
}

function isM2MDataglobal(integration) {
  const provider = String(integration?.proveedor || "").trim().toLowerCase();
  const base = cleanBaseUrl(integration?.base_url).toLowerCase();
  return provider.includes("m2mdataglobal") || base.includes("m2mcenter.app/apiclient/v1");
}

function assertConfigured(integration) {
  if (!integration) throw new Error("No hay integración M2M configurada para la empresa.");
  if (!integration.estado) throw new Error("La integración M2M está inactiva.");
  if (!integration.auth_token) throw new Error("La integración M2M no tiene API Key configurada.");
  if (!isM2MDataglobal(integration)) throw new Error("Proveedor M2M no soportado en esta versión.");
}

async function request(integration, path, options = {}) {
  assertConfigured(integration);
  const base = cleanBaseUrl(integration.base_url);
  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = {
    Accept: "application/json",
    "X-API-KEY": integration.auth_token,
    "User-Agent": process.env.M2M_API_USER_AGENT || "IT-GPS-APP/2.0"
  };
  if (options.body) headers["Content-Type"] = "application/json";
  const controller = new AbortController();
  const timeout = Math.min(60000, Math.max(1000, Number(integration.timeout_ms || 10000)));
  const timer = setTimeout(() => controller.abort(), timeout);
  const started = Date.now();
  try {
    const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) }, signal: controller.signal });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!response.ok) {
      const message = data?.error || data?.message || `HTTP ${response.status}`;
      const err = new Error(String(message));
      err.httpStatus = response.status;
      err.url = url;
      err.durationMs = Date.now() - started;
      throw err;
    }
    if (data && data.status === false) {
      const err = new Error(String(data.error || data.message || "El proveedor rechazó la solicitud."));
      err.httpStatus = response.status;
      err.url = url;
      err.durationMs = Date.now() - started;
      throw err;
    }
    return { data, status: response.status, url, durationMs: Date.now() - started };
  } catch (error) {
    if (error.name === "AbortError") {
      const err = new Error("Tiempo de espera agotado al consultar M2MDataglobal.");
      err.url = url; err.durationMs = Date.now() - started; err.code = "TIMEOUT";
      throw err;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function unwrapData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.sims)) return data.sims;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizeState(value) {
  const v = String(value || "").trim().toUpperCase();
  if (["ACTIVE", "ACTIVA", "ENABLED", "UP", "ONLINE"].includes(v)) return "Activa";
  if (["SUSPENDED", "SUSPENDIDA", "SUSPENDED_BY_PROVIDER", "BLOCKED"].includes(v)) return "Suspendida";
  if (["DELETED", "BAJA", "DISABLED", "INACTIVE"].includes(v)) return "Baja";
  if (["ASSIGNED", "ASIGNADA"].includes(v)) return "Asignada";
  if (["AVAILABLE", "DISPONIBLE"].includes(v)) return "Disponible";
  return value ? String(value) : "En inventario";
}

export function normalizeSim(item = {}) {
  return {
    iccid: String(item.icc ?? item.iccid ?? "").trim(),
    msisdn: String(item.msisdn ?? item.numero ?? "").trim(),
    imsi: String(item.imsi ?? "").trim(),
    planCode: String(item.planCode ?? "").trim(),
    planName: String(item.planName ?? "").trim(),
    imei: String(item.imei ?? "").trim(),
    operator: String(item.operator ?? item.operador ?? "").trim(),
    apn: String(item.apn ?? "").trim(),
    state: normalizeState(item.simCycleState ?? item.estado),
    gprsStatus: String(item.gprsStatus ?? "").trim(),
    lastConnStart: item.lastConnStart ?? null,
    lastConnStop: item.lastConnStop ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    commModuleManufacturer: String(item.commModuleManufacturer ?? "").trim(),
    commModuleModel: String(item.commModuleModel ?? "").trim(),
    consumptionMonthlyData: Number(item.consumptionMonthlyData ?? 0) || 0,
    consumptionDailyData: Number(item.consumptionDailyData ?? 0) || 0,
    customField1: item.customField1 ?? "",
    customField2: item.customField2 ?? ""
  };
}

export async function listSims(integration) {
  return request(integration, "/sims/simList", { method: "GET" });
}

export async function getSimByIcc(integration, icc) {
  return request(integration, `/sims/simDetails/icc/${encodeURIComponent(icc)}`, { method: "GET" });
}

export async function getSimByMsisdn(integration, msisdn) {
  return request(integration, `/sims/simDetails/msisdn/${encodeURIComponent(msisdn)}`, { method: "GET" });
}

export async function getSimByImei(integration, imei) {
  return request(integration, `/sims/simDetails/imei/${encodeURIComponent(imei)}`, { method: "GET" });
}

export async function testGsm(integration, identifierType, identifier) {
  return request(integration, `/sims/testGsm/${encodeURIComponent(identifierType)}/${encodeURIComponent(identifier)}`, { method: "GET" });
}

export async function testGprs(integration, identifierType, identifier) {
  return request(integration, `/sims/testGprs/${encodeURIComponent(identifierType)}/${encodeURIComponent(identifier)}`, { method: "GET" });
}

export async function resetSim(integration, identifierType, identifier) {
  return request(integration, `/sims/reset/${encodeURIComponent(identifierType)}/${encodeURIComponent(identifier)}`, { method: "GET" });
}

export async function sendSms(integration, identifierType, identifier, message) {
  return request(integration, `/sims/sms/${encodeURIComponent(identifierType)}/${encodeURIComponent(identifier)}`, { method: "POST", body: JSON.stringify({ message }) });
}

export async function updateCustomFields(integration, identifierType, identifier, customField1, customField2) {
  return request(integration, `/customfields/sms/${encodeURIComponent(identifierType)}/${encodeURIComponent(identifier)}`, { method: "POST", body: JSON.stringify({ customField1, customField2 }) });
}

export { DEFAULT_BASE_URL, isM2MDataglobal };
