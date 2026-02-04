// Type definitions for backblaze-b2
declare module 'backblaze-b2' {
  interface B2Options {
    applicationKeyId: string;
    applicationKey: string;
    retry?: {
      retries?: number;
    };
  }

  interface AuthorizeResponse {
    data: {
      accountId: string;
      apiUrl: string;
      authorizationToken: string;
      downloadUrl: string;
    };
  }

  interface GetBucketResponse {
    data: {
      buckets: Array<{
        bucketId: string;
        bucketName: string;
        bucketType: string;
      }>;
    };
  }

  interface GetUploadUrlResponse {
    data: {
      uploadUrl: string;
      authorizationToken: string;
    };
  }

  interface UploadFileResponse {
    data: {
      fileId: string;
      fileName: string;
      contentLength: number;
      contentType: string;
      contentSha1: string;
    };
  }

  interface ListFileNamesResponse {
    data: {
      files: Array<{
        fileId: string;
        fileName: string;
        contentLength: number;
        contentType: string;
        uploadTimestamp: number;
      }>;
      nextFileName: string | null;
    };
  }

  interface GetFileInfoResponse {
    data: {
      fileId: string;
      fileName: string;
      contentLength: number;
      contentType: string;
      uploadTimestamp: number;
    };
  }

  class B2 {
    constructor(options: B2Options);
    authorize(): Promise<AuthorizeResponse>;
    getBucket(options: { bucketName?: string; bucketId?: string }): Promise<GetBucketResponse>;
    getUploadUrl(options: { bucketId: string }): Promise<GetUploadUrlResponse>;
    uploadFile(options: {
      uploadUrl: string;
      uploadAuthToken: string;
      fileName: string;
      data: Buffer;
      hash?: string;
      mime?: string;
      onUploadProgress?: (event: { loaded: number; total: number }) => void;
    }): Promise<UploadFileResponse>;
    listFileNames(options: {
      bucketId: string;
      prefix?: string;
      maxFileCount?: number;
      startFileName?: string;
    }): Promise<ListFileNamesResponse>;
    deleteFileVersion(options: {
      fileId: string;
      fileName: string;
    }): Promise<void>;
    getFileInfo(options: { fileId: string }): Promise<GetFileInfoResponse>;
  }

  export = B2;
}
