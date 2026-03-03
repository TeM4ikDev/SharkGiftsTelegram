export interface TonApiResponse {
  ok: boolean;
  result: TonTransaction[];
}

export interface TonTransaction {
  '@type': 'raw.transaction';
  address: AccountAddress;
  utime: number;
  data: string;
  transaction_id: TransactionId;
  fee: string;
  storage_fee: string;
  other_fee: string;
  in_msg: RawMessage;
  out_msgs: RawMessage[];
}

export interface AccountAddress {
  '@type': 'accountAddress';
  account_address: string;
}

export interface TransactionId {
  '@type': 'internal.transactionId';
  lt: string;
  hash: string;
}

export interface RawMessage {
  '@type': 'raw.message';
  hash: string;
  source: string;
  destination: string;
  value: string;
  extra_currencies: any[];
  fwd_fee: string;
  ihr_fee: string;
  created_lt: string;
  body_hash: string;
  msg_data: MessageData;
  message: string;
}

export interface MessageData {
  '@type': 'msg.dataText' | 'msg.dataRaw';
  text?: string;
  body?: string;
  init_state?: string;
}


export interface FragmentApiBuyStarsResponse {
  success: boolean;
  id: string;
  receiver: string;
  goods_quantity: number;
  sender: {
    phone_number: string;
    name: string | null;
  } | null;
  ton_price: string | null;
  ref_id: string | null;
}


