import { TestHandler } from "../../TestHandler"
import { Decode, Encode } from "../../../src"

TestHandler.testDriver("Plain deduplicate strings", new Encode.SinglePass.Unsorted, new Decode.SinglePass)