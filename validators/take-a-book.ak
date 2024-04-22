use aiken/cbor
use aiken/list
//use aiken/string
use aiken/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, ScriptContext, Spend,
  Transaction, TransactionId,
} as tx
use aiken/transaction/credential.{Address, VerificationKeyCredential}
use aiken/transaction/value.{zero}
use take_a_book/types.{Datum, OracleDatum}
use take_a_book/utils.{
  books_from_value, get_allowed_policies, takes_equals_leaves,
  value_sent_to_with_datum,
}

validator(oracle_policy: ByteArray) {
  fn take_a_book(_datum: Datum, _redeemer: Void, context: ScriptContext) -> Bool {
    expect ScriptContext(
      Transaction(inputs, reference_inputs, ..),
      tx.Spend(input_ref),
    ) = context
    let allowed_policies = get_allowed_policies(reference_inputs, oracle_policy)
    // Get required information for script context.
    expect Some(Input(_, Output(addr, out_val, ..))) =
      tx.find_input(inputs, input_ref)
    let expected_datum = Datum { prev_input: Some(input_ref) }
    let in_val =
      value_sent_to_with_datum(context.transaction, addr, expected_datum)
    let is_valid = takes_equals_leaves(out_val, in_val, allowed_policies)
    // todo 
    is_valid?
  }
}

//-----------------------------------------------------------------------------

test books_received() {
  let book_policies =
    [#"efff17a2e610e5c9f46e33fe964c39602399f95aa367b37f039c1efc"]
  let wrong_policy = #"efff17a2e610e5c9f46e33fe964c39602399f95aa367b37f039c1efd"

  expect Some(policy_id) = list.at(book_policies, 0)
  let val =
    zero()
      |> value.add(policy_id, #"beef", 10)
  let result = books_from_value(val, book_policies)

  let wrong_val =
    zero()
      |> value.add(wrong_policy, #"beef", 10)
  let wrong_result = books_from_value(wrong_val, book_policies)
  result == 10 && wrong_result == 0
}

test runs() {
  let oracle_policy =
    #"efff17a2e610e5c9f46e33fe964c39602399f95aa367b37f039c1eab"

  let oracle_datum =
    OracleDatum {
      allowed_policies: [
        #"efff17a2e610e5c9f46e33fe964c39602399f95aa367b37f039c1efc",
      ],
      updated_at: 0,
    }

  let oracle_value =
    zero()
      |> value.add(oracle_policy, #"beef", 1)

  let book_policy = #"efff17a2e610e5c9f46e33fe964c39602399f95aa367b37f039c1efc"
  let out_val =
    zero()
      |> value.add(book_policy, #"beef", 10)

  let script_utxo =
    OutputReference { transaction_id: TransactionId("1234"), output_index: 0 }
  let dat = Datum { prev_input: Some(script_utxo) }

  let sendback_utxo =
    OutputReference { transaction_id: TransactionId("1235"), output_index: 1 }

  let reference_input_utxo =
    OutputReference { transaction_id: TransactionId("1236"), output_index: 0 }
  let sendback_val =
    zero()
      |> value.add(book_policy, #"beff", 10)
  let oracle_policy =
    #"efff17a2e610e5c9f46e33fe964c39602399f95aa367b37f039c1eab"
  //let redeemer = Redeemer { msg: "Hello, World!" }
  let context =
    ScriptContext {
      purpose: Spend(script_utxo),
      transaction: tx.placeholder()
        |> fn(transaction) {
            Transaction {
              ..transaction,
              reference_inputs: [
                Input {
                  output_reference: reference_input_utxo,
                  output: Output {
                    address: Address {
                      payment_credential: VerificationKeyCredential("1234567"),
                      stake_credential: None,
                    },
                    value: oracle_value,
                    datum: InlineDatum(oracle_datum),
                    //InlineDatum(dat),
                    reference_script: None,
                  },
                },
              ],
              inputs: // extra_signatories: [dat.owner],
              [
                Input {
                  output_reference: script_utxo,
                  output: Output {
                    address: Address {
                      payment_credential: VerificationKeyCredential("1234"),
                      stake_credential: None,
                    },
                    value: out_val,
                    datum: NoDatum,
                    //InlineDatum(dat),
                    reference_script: None,
                  },
                },
                Input {
                  output_reference: sendback_utxo,
                  output: Output {
                    address: Address {
                      payment_credential: VerificationKeyCredential("12345"),
                      stake_credential: None,
                    },
                    value: out_val,
                    datum: NoDatum,
                    //InlineDatum(dat),
                    reference_script: None,
                  },
                },
              ],
              outputs: [
                Output {
                  address: Address {
                    payment_credential: VerificationKeyCredential("12345"),
                    stake_credential: None,
                  },
                  value: out_val,
                  datum: NoDatum,
                  //InlineDatum(dat),
                  reference_script: None,
                },
                Output {
                  address: Address {
                    payment_credential: VerificationKeyCredential("1234"),
                    stake_credential: None,
                  },
                  value: sendback_val,
                  datum: InlineDatum(dat),
                  reference_script: None,
                },
              ],
            }
          },
    }
  take_a_book(oracle_policy, dat, Void, context)
}
