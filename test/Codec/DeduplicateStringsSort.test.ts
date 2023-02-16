import { TestHandler } from "../TestHandler"
import { Decode, Encode } from "../../src"

TestHandler.testDriver("Deduplicate strings (sort)", new Encode.DeduplicateStringsSort, new Decode.SinglePass)