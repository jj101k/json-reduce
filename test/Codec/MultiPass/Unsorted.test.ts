import { TestHandler } from "../../TestHandler"
import { Decode, Encode } from "../../../src"

TestHandler.testDriver("Deduplicate strings (repass)", new Encode.MultiPass.Unsorted, new Decode.MultiPass)