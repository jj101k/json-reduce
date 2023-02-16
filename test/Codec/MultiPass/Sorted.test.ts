import { TestHandler } from "../../TestHandler"
import { Decode, Encode } from "../../../src"

TestHandler.testDriver("Deduplicate strings (sort, repass)", new Encode.MultiPass.Sorted, new Decode.MultiPass)