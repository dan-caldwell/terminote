const Utils = require('../classes/Utils');

test("isEqualObject", () => {
    const a = {
        a: 1,
        b: 2,
        c: "hello"
    }
    const b = {
        a: 1,
        b: 2,
        c: "hello"
    }
    expect(Utils.isEqualObject(a, b)).toEqual(true);
});