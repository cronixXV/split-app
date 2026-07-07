import axios, { AxiosError, type AxiosResponse } from 'axios';

interface IApiErrorResponse {
  error?: string;
  code?: string;
  details?: unknown;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);

    this.name = 'ApiError';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,

  (error: AxiosError<IApiErrorResponse>): Promise<never> => {
    if (error.response) {
      const responseBody = error.response.data;

      return Promise.reject(
        new ApiError(
          responseBody?.error ??
            `Request failed with status ${error.response.status}`,
          error.response.status,
          responseBody?.code,
          responseBody?.details
        )
      );
    }

    if (error.request) {
      return Promise.reject(
        new ApiError(
          error.code === 'ECONNABORTED'
            ? 'Request timed out'
            : 'Server is unavailable',
          0,
          error.code ?? 'NETWORK_ERROR'
        )
      );
    }

    return Promise.reject(
      new ApiError(
        error.message || 'Failed to prepare request',
        0,
        error.code ?? 'REQUEST_ERROR'
      )
    );
  }
);
