const SAME = {
    is_same: true, path: "", source: null, target: null,
};

function not_same(p1, p2) {
    return {
        is_same: false,
        path: ".",
        source: p1,
        target: p2
    }
}

function compare_array(a1, a2) {

    if (a1 === a2) {
        return SAME;
    } else if (a1 == null || a2 == null) {
        return not_same(a1, a2);
    } else if (a1.length !== a2.length) {
        return not_same(a1, a2);
    }

    let difference_count = 0;
    let last_differ_path = "";
    let last_differ_key  = null;
    let last_source      = null;
    let last_target      = null;
    for (let i = 0; i < a1.length; i++) {
        let {is_same, path, source, target} = compare(a1[i], a2[i]);
        if (!is_same) {
            difference_count += 1;
            last_differ_path = path;
            last_differ_key  = i;
            last_source      = source;
            last_target      = target;
        }
    }

    if (difference_count === 0) {
        return SAME;
    }

    if (difference_count > 1) {
        return not_same(a1, a2);
    }

    return {
        is_same: false,
        path: `.[${last_differ_key}]${last_differ_path}`,
        source: last_source,
        target: last_target
    }
}

function sort_object(obj) {
    return Object.keys(obj).sort().reduce(function (result, key) {
        result[key] = obj[key];
        return result;
    }, {});
}

function compare_object(o1, o2) {
    if (o1 === o2) {
        return SAME;
    } else if (o1 == null || o2 == null) {
        return not_same(o1, o2);
    } else if (Object.keys(o1).length !== Object.keys(o2).length) {
        return not_same(o1, o2);
    }

    const s1 = sort_object(o1);
    const s2 = sort_object(o2);

    let difference_count = 0;
    let last_differ_path = "";
    let last_differ_key  = null;
    let last_source      = null;
    let last_target      = null;
    for (let k in s1) {
        let {is_same, path, source, target} = compare(s1[k], s2[k]);
        if (!is_same) {
            difference_count += 1;
            last_differ_path = path;
            last_differ_key  = k;
            last_source      = source;
            last_target      = target;
        }
    }

    if (difference_count === 0) {
        return SAME;
    }

    if (difference_count > 1) {
        return not_same(o1, o2);
    }

    return {
        is_same: false,
        path: `.["${last_differ_key}"]${last_differ_path}`,
        source: last_source,
        target: last_target,
    }
}

function compare(object1, object2) {
    if (object1 === object2) {
        return SAME;
    }

    if (Array.isArray(object1) && Array.isArray(object2)) {
        return compare_array(object1, object2);
    } else if (typeof object1 === 'object' && typeof object2 === 'object') {
        return compare_object(object1, object2);
    } else return not_same(object1, object2);
}


// tests

function test_0() {
    const a = {"hello": "world", "some": 1};
    const b = {"hello": "world", "some": 1};

    const {is_same, path, source, target} = compare(a, b);
    console.assert(is_same === true, `is_same expect true, get ${is_same}`);
    console.assert(path === '', `path expect '', get ${path}`);
    console.assert(source === null, `source expect null, get ${JSON.stringify(source)}`);
    console.assert(target === null, `target expect null, get ${JSON.stringify(target)}`);
    console.log(`result is ${is_same}`);
}

function test_1() {
    const a = {"hello": "world", "some": 1};
    const b = {"hello": "nothing", "some": 1};

    const {is_same, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.["hello"].', `path expect '.', get ${path}`);
    console.assert(source === "world", `source expect 'world', get ${JSON.stringify(source)}`);
    console.assert(target === "nothing", `target expect 'nothing', get ${JSON.stringify(target)}`);
    console.log(`result is ${is_same}, path is ${path}, differ from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

function test_2() {
    const a = [1, 2, 3];
    const b = [1, 3, 2];

    const {is_same, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(source === a, `source expect ${JSON.stringify(a)}, get ${JSON.stringify(source)}`);
    console.assert(target === b, `target expect ${JSON.stringify(b)}, get ${JSON.stringify(target)}`);
    console.log(`result is ${is_same}, path is ${path}, differ from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

function test_3() {
    const a = {
        "root_1": {
            "level_1": {
                "a": "a_value",
                "b": "b_value",
            }
        },
        "root_2": {
            "hello": "world",
        },
        "root_3": [1, 2, 3],
    };

    const b = {
        "root_2": {
            "hello": "world",
        },
        "root_1": {
            "level_1": {
                "b": "b_value",
                "a": "a_value_changed",
            }
        },
        "root_3": [1, 2, 3],
    };

    const {is_same, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.["root_1"].["level_1"].["a"].', `path expect '.["root_1"].["level_1"].["a"].', get ${path}`);
    console.assert(source === 'a_value', `source expect 'a_value', get ${JSON.stringify(source)}`);
    console.assert(target === 'a_value_changed', `target expect 'a_value_changed', get ${JSON.stringify(target)}`);
    console.log(`result is ${is_same}, path is ${path}, differ from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

function test_4() {
    const a = [1, {
        "a": "a_value",
        "b": "b_value"
    }, 3];

    const b = [1, {
        "a": "a_value_changed",
        "b": "b_value"
    }, 3];

    const {is_same, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.[1].["a"].', `path expect '.[1].["a"]', get ${path}`);
    console.assert(source === "a_value", `source expect 'a_value', get ${JSON.stringify(source)}`);
    console.assert(target === "a_value_changed", `target expect 'a_value_changed', get ${JSON.stringify(target)}`);
    console.log(`result is ${is_same}, path is ${path}, differ from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}


function test_5() {
    const a = {
        "root_1": {
            "level_1": {
                "a": "a_value",
                "b": "b_value",
            }
        },
        "root_2": {
            "hello": "world",
        },
        "root_3": [1, 2, 3],
    };

    const b = {
        "root_2": {
            "hello": "world",
        },
        "root_1": {
            "level_1": {
                "b": "b_value",
                "a": "a_value",
            }
        },
    };

    const {is_same, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(source === a, `source expect ${a}, get ${JSON.stringify(source)}`);
    console.assert(target === b, `target expect ${b}, get ${JSON.stringify(target)}`);
    console.log(`result is ${is_same}, path is ${path}, differ from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

// test_0();
// test_1();
// test_2();
// test_3();
// test_4();
test_5();