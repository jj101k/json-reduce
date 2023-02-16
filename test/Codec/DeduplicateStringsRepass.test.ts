import { TestHandler } from "../TestHandler"
import { Decode, Encode } from "../../src"

TestHandler.testDriver("Deduplicate strings (repass)", new Encode.DeduplicateStringsRepass, new Decode.MultiPass)