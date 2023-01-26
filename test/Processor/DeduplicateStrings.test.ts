import { DeduplicateStrings } from "../../src/Processor/DeduplicateStrings"
import { TestHandler } from "../TestHandler"

TestHandler.testDriver("Plain deduplicate strings", new DeduplicateStrings)