use aiken/hash.{Blake2b_224, Hash}
use aiken/transaction.{OutputReference}
use aiken/transaction/credential.{Script}

pub type Datum {
  prev_input: Option<OutputReference>,
}

pub type ScriptHash =
  Hash<Blake2b_224, Script>

pub type POSIXTime =
  Int

pub type OracleDatum {
  allowed_policies: List<ByteArray>,
  updated_at: POSIXTime,
}
