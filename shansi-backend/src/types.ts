export type AppEnv = {
  Variables: {
    userId: string;
    phone: string;
  };
};

export type AdminEnv = {
  Variables: {
    adminId: string;
    adminRole: string;
  };
};

export type MerchantEnv = {
  Variables: {
    merchantId: string;
  };
};
