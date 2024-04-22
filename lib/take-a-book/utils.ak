use aiken/cbor
use aiken/list
//use aiken/string
use aiken/transaction.{
  DatumHash, InlineDatum, Input, NoDatum, Output, Transaction,
} as tx
use aiken/transaction/credential.{Address}
use aiken/transaction/value.{Value, merge, zero}
use take_a_book/types.{Datum, OracleDatum}

/// We expect outputs to be unique. Each output is tagged with a datum.
/// We also expect the datum to be inline
pub fn value_sent_to_with_datum(
  tx: Transaction,
  address: Address,
  payment_datum: Datum,
) -> Value {
  let outputs =
    list.filter(
      tx.outputs,
      fn(output) {
        let is_same_datum = output.datum == InlineDatum(payment_datum)
        let is_same_address =
          output.address.payment_credential == address.payment_credential
        is_same_datum? && is_same_address?
      },
    )
  let val =
    list.foldl(
      outputs,
      zero(),
      fn(output: Output, final_val: Value) -> Value {
        merge(final_val, output.value)
      },
    )
  val
}

pub fn value_sent_to(tx: Transaction, address: Address) -> Value {
  let outputs =
    list.filter(
      tx.outputs,
      fn(output) {
        output.address.payment_credential == address.payment_credential
      },
    )
  let val =
    list.foldl(
      outputs,
      zero(),
      fn(output: Output, final_val: Value) -> Value {
        merge(final_val, output.value)
      },
    )
  val
}

pub fn books_from_value(val: Value, book_policies: List<ByteArray>) -> Int {
  let result =
    value.reduce(
      val,
      0,
      fn(policy, _, quantity, acc) {
        if list.has(book_policies, policy) {
          acc + quantity
        } else {
          acc
        }
      },
    )
  result
}

pub fn takes_equals_leaves(
  out_val: Value,
  in_val: Value,
  book_policies: List<ByteArray>,
) -> Bool {
  let out_book_val = books_from_value(out_val, book_policies)
  let in_book_val = books_from_value(in_val, book_policies)
  out_book_val <= in_book_val
}

pub fn get_allowed_policies(
  ref_inputs: List<Input>,
  oracle_policy: ByteArray,
) -> List<ByteArray> {
  let oracle_inputs =
    ref_inputs
      |> list.filter(
          fn(input) {
            let val = input.output.value
            let has_oracle_token = list.has(value.policies(val), oracle_policy)
            has_oracle_token
          },
        )
  expect Some(input) = list.at(oracle_inputs, 0)
  let oracle_datum = input.output.datum
  when oracle_datum is {
    NoDatum -> fail
    DatumHash(_) -> fail
    InlineDatum(d) -> {
      expect return_datum: OracleDatum = d
      return_datum.allowed_policies
    }
  }
  //  return_datum
}
