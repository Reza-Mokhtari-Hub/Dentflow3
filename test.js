const blocksStr = "[\"abc\", 123]";
try { JSON.parse(blocksStr); console.log("is json"); } catch (e) { console.log("not json"); }
