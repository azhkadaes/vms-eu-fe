import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

const TOKEN_KEY = "vms_access_token";

export interface ApiErrorField {
  code: string;
  message: string;
  field?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorField;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly field?: string;
  public readonly rawResponse?: ApiErrorResponse;

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    field?: string,
    rawResponse?: ApiErrorResponse,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.field = field;
    this.rawResponse = rawResponse;
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token === null) {
    window.localStorage.removeItem(TOKEN_KEY);
  } else {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

function createApiInstance(): AxiosInstance {
  const baseURL = import.meta.env.VITE_API_URL as string | undefined;

  if (!baseURL) {
    console.warn(
      "[api.ts] VITE_API_URL tidak didefinisikan di environment variable. Pastikan file .env ada dengan VITE_API_URL=http://localhost:8080/v1",
    );
  }

  const instance = axios.create({
    baseURL: baseURL || "http://localhost:8080/v1",
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError): Promise<AxiosError> => {
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      return response;
    },
    async (error: AxiosError): Promise<never> => {
      if (!error.response) {
        throw new ApiError(
          0,
          "NETWORK_ERROR",
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
        );
      }

      const { status, data } = error.response;
      const errorPayload = data as ApiErrorResponse | undefined;
      const errorField = errorPayload?.error;

      const code = errorField?.code || "UNKNOWN_ERROR";
      const message =
        errorField?.message || getDefaultMessageForStatus(status);
      const field = errorField?.field;

      if (status === 401) {
        clearAuthStorage();
      }

      throw new ApiError(status, code, message, field, errorPayload);
    },
  );

  return instance;
}

function getDefaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Request tidak valid.";
    case 401:
      return "Sesi Anda telah berakhir. Silakan coba lagi.";
    case 403:
      return "Anda tidak memiliki izin untuk mengakses resource ini.";
    case 404:
      return "Data tidak ditemukan.";
    case 409:
      return "Terjadi konflik dengan data yang ada.";
    case 410:
      return "Resource ini sudah tidak berlaku (kedaluwarsa).";
    case 422:
      return "Validasi gagal. Periksa kembali input Anda.";
    case 500:
      return "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
    default:
      return "Terjadi kesalahan yang tidak diketahui.";
  }
}

export const api: AxiosInstance = createApiInstance();

export async function get<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.get<T>(url, config);
  return response.data;
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.post<T>(url, data, config);
  return response.data;
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.put<T>(url, data, config);
  return response.data;
}

export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.patch<T>(url, data, config);
  return response.data;
}

export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await api.delete<T>(url, config);
  return response.data;
}

export default api;
