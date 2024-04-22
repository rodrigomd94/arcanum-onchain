use aiken/cbor
use aiken/transaction.{Input, Output, ScriptContext, Transaction} as tx
use take_a_book/types.{OracleDatum}
use take_a_book/utils.{value_sent_to}

validator {
  fn main(datum: OracleDatum, _redeemer: Void, context: ScriptContext) -> Bool {
    trace @"Running oracle validator"
    expect ScriptContext(Transaction(inputs, ..), tx.Spend(input_ref)) = context
    expect Some(Input(_, Output(addr, out_val, ..))) =
      tx.find_input(inputs, input_ref)
    let in_val = value_sent_to(context.transaction, addr)
    trace cbor.diagnostic(in_val)
    trace cbor.diagnostic(out_val)
    in_val == out_val
  }
}
