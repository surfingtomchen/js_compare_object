const SAME = {
    is_same: true, path: null, op: null, source: null, target: null,
};

const OP_ADD_KEYS        = Symbol("add_keys");
const OP_REMOVE_KEYS     = Symbol("remove_keys");
const OP_REPLACE         = Symbol("replace");
const OP_TRUNC_ELEMENTS  = Symbol("trunc_elements");            // 数组尾部删除了元素
const OP_APPEND_ELEMENTS = Symbol("append_elements");           // 数组尾部添加了元素

function root_is_different(op, p1, p2) {
    return {
        is_same: false, path: ".", op, source: p1, target: p2
    }
}

function is_empty_object(o) {
    return Object.keys(o).length === 0;
}

function equals(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return array_equals(a, b)
    } else if (typeof a === 'object' && typeof b === 'object') {
        return object_equals(a, b)
    } else {
        return a === b
    }
}

function sort_object(obj) {
    if (obj == null) return null;

    return Object.keys(obj).sort().reduce(function (result, key) {
        result[key] = obj[key];
        return result;
    }, {});
}

function object_equals(a, b) {
    let sa = sort_object(a);
    let sb = sort_object(b);
    return JSON.stringify(sa) === JSON.stringify(sb);
}

function array_equals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => equals(val, b[index]));
}

function compare_array(a1, a2) {

    if (a1 === a2 || array_equals(a1, a2)) {
        return SAME;
    } else if (a1 == null) {
        return root_is_different(OP_APPEND_ELEMENTS, null, a2);
    } else if (a2 == null) {
        return root_is_different(OP_TRUNC_ELEMENTS, null, a1);
    }

    let difference_count = 0;
    let last_differ_path = "";
    let last_differ_key  = null;
    let last_source      = null;
    let last_target      = null;
    let last_op          = OP_REPLACE;

    let idx_1 = 0;
    let idx_2 = 0;

    while (idx_1 < a1.length || idx_2 < a2.length) {
        if (idx_1 < a1.length && idx_2 < a2.length) {
            let {is_same, path, op, source, target} = compare(a1[idx_1], a2[idx_2]);
            if (!is_same) {
                difference_count += 1;
                last_differ_path = path;
                last_differ_key  = idx_1;
                last_source      = source;
                last_target      = target;
                last_op          = op;
            }
            idx_1 += 1;
            idx_2 += 1;
        } else {
            if (idx_1 === a1.length) {
                last_target = [];
                for (; idx_2 < a2.length; idx_2++) {
                    last_target.push(a2[idx_2]);
                }
                last_op = OP_APPEND_ELEMENTS;
            } else if (idx_2 === a2.length) {
                last_target = [];
                for (; idx_1 < a1.length; idx_1++) {
                    last_target.push(a1[idx_1]);
                }
                last_op = OP_TRUNC_ELEMENTS;
            }
        }
    }

    if (difference_count === 0 && idx_1 === idx_2) {
        return SAME;
    } else if (difference_count === 0) {
        return root_is_different(last_op, null, last_target);
    }

    if (difference_count > 1 || difference_count === 1 && idx_1 !== idx_2) {
        return root_is_different(OP_REPLACE, a1, a2);
    }

    return {
        is_same: false, op: last_op, path: `.[${last_differ_key}]${last_differ_path}`, source: last_source, target: last_target
    }
}

function compare_object(o1, o2) {
    if (o1 === o2 || object_equals(o1, o2)) {
        return SAME;
    } else if (o1 == null) {
        return root_is_different(OP_ADD_KEYS, null, o2);
    } else if (o2 == null) {
        return root_is_different(OP_REMOVE_KEYS, null, o1);
    }

    const s1 = sort_object(o1);
    const s2 = sort_object(o2);

    let difference_count = 0;
    let last_differ_path = "";
    let last_differ_key  = null;
    let last_source      = null;
    let last_target      = null;
    let last_op          = OP_REPLACE;

    let keys_removed = {};
    for (let k in s1) {
        if (Object.keys(s2).indexOf(k) >= 0) {
            // k exists in s2
            let {is_same, op, path, source, target} = compare(s1[k], s2[k]);
            if (!is_same) {
                difference_count += 1;
                last_differ_path = path;
                last_differ_key  = k;
                last_source      = source;
                last_target      = target;
                last_op          = op;
            }
            delete s2[k];
        } else {
            // k not exists in s2
            keys_removed[k] = s1[k];
        }
    }

    let keys_added = s2;

    if (difference_count === 0) {

        if (is_empty_object(keys_added) && is_empty_object(keys_removed)) {
            return SAME;
        }

        if (!is_empty_object(keys_added) && !is_empty_object(keys_removed)) {
            return root_is_different(OP_REPLACE, o1, o2);
        }

        if (!is_empty_object(keys_added)) {
            return root_is_different(OP_ADD_KEYS, null, keys_added);
        }

        if (!is_empty_object(keys_removed)) {
            return root_is_different(OP_REMOVE_KEYS, null, keys_removed);
        }
    }

    if (difference_count > 1 || difference_count === 1 && (!is_empty_object(keys_added) || !is_empty_object(keys_removed))) {
        return root_is_different(OP_REPLACE, o1, o2);
    }


    return {
        is_same: false, op: last_op, path: `.["${last_differ_key}"]${last_differ_path}`, source: last_source, target: last_target,
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
    } else return root_is_different(OP_REPLACE, object1, object2);
}

// tests
function test_0() {
    const a = {"hello": "world", "some": 1};
    const b = {"some": 1, "hello": "world"};

    const {is_same, op, path, source, target} = compare(a, b);
    console.assert(is_same === true, `is_same expect true, get ${is_same}`);
    console.assert(path == null, `path expect null, get ${path}`);
    console.assert(op == null, `op expect null, get ${op}`);
    console.assert(source == null, `source expect null, get ${JSON.stringify(source)}`);
    console.assert(target == null, `target expect null, get ${JSON.stringify(target)}`);
    console.log(`test 0: result is ${is_same}`);
}

function test_1() {
    const a = {"hello": "world", "some": 1};
    const b = {"hello": "nothing", "some": 1};

    const {is_same, op, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.["hello"].', `path expect '.', get ${path}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE, get ${JSON.stringify(op)}`);
    console.assert(source === "world", `source expect 'world', get ${JSON.stringify(source)}`);
    console.assert(target === "nothing", `target expect 'nothing', get ${JSON.stringify(target)}`);
    console.log(`test 1: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

function test_2() {
    const a = [1, 2, 3];
    const b = [1, 3, 2];

    const {is_same, op, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE, get ${JSON.stringify(op)}`);
    console.assert(source === a, `source expect ${JSON.stringify(a)}, get ${JSON.stringify(source)}`);
    console.assert(target === b, `target expect ${JSON.stringify(b)}, get ${JSON.stringify(target)}`);
    console.log(`test 2: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

function test_3() {
    const a = {
        "root_1": {
            "level_1": {
                "a": "a_value", "b": "b_value",
            }
        }, "root_2": {
            "hello": "world",
        }, "root_3": [1, 2, 3],
    };

    const b = {
        "root_2": {
            "hello": "world",
        }, "root_1": {
            "level_1": {
                "b": "b_value", "a": "a_value_changed",
            }
        }, "root_3": [1, 2, 3],
    };

    const {is_same, op, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.["root_1"].["level_1"].["a"].', `path expect '.["root_1"].["level_1"].["a"].', get ${path}`);
    console.assert(source === 'a_value', `source expect 'a_value', get ${JSON.stringify(source)}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE, get ${JSON.stringify(op)}`);
    console.assert(target === 'a_value_changed', `target expect 'a_value_changed', get ${JSON.stringify(target)}`);
    console.log(`test 3: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

function test_4() {
    const a = [1, {
        "a": "a_value", "b": "b_value"
    }, 3];

    const b = [1, {
        "a": "a_value_changed", "b": "b_value"
    }, 3];

    const {is_same, path, op, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.[1].["a"].', `path expect '.[1].["a"]', get ${path}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE, get ${JSON.stringify(op)}`);
    console.assert(source === "a_value", `source expect 'a_value', get ${JSON.stringify(source)}`);
    console.assert(target === "a_value_changed", `target expect 'a_value_changed', get ${JSON.stringify(target)}`);
    console.log(`test 4: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

function test_5() {
    const a = {
        "root_1": {
            "level_1": {
                "a": "a_value", "b": "b_value",
            }
        }, "root_2": {
            "hello": "world",
        }, "root_3": [1, 2, 3],
    };

    const b = {
        "root_2": {
            "hello": "world",
        }, "root_1": {
            "level_1": {
                "b": "b_value", "a": "a_value",
            }
        },
    };

    const {is_same, op, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_REMOVE_KEYS, `op expect OP_REMOVE_KEYS, get ${JSON.stringify(op)}`);
    console.assert(source === null, `source expect null, get ${JSON.stringify(source)}`);
    console.assert(object_equals(target, {"root_3": [1, 2, 3]}), `target expect {"root_3": [1, 2, 3]}, get ${JSON.stringify(target)}`);
    console.log(`test 5: result is ${is_same}, op is ${op.toString()}, path is ${path}, removed ${JSON.stringify(target)}`);
}

function test_6() {
    const a = [1, 2, 3];
    const b = [1, 2, 3, 5, 6, {"a": "a_value"}];

    const {is_same, op, path, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_APPEND_ELEMENTS, `op expect OP_ADD_ELE, get ${JSON.stringify(op)}`);
    console.assert(source === null, `source expect null, get ${JSON.stringify(source)}`);
    console.assert(array_equals(target, [5, 6, {"a": "a_value"}]), `target expect [5,6,{"a":"a_value"}], get ${JSON.stringify(target)}`);
    console.log(`test 6: result is ${is_same}, op is ${op.toString()}, path is ${path}, ${JSON.stringify(target)} added`);
}

function test_7() {
    const a = [1, {
        "a": "a_value", "b": "b_value"
    }, 3];

    const b = [1, {
        "a": "a_value_changed", "b": "b_value"
    }, 4];

    const {is_same, path, op, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE, get ${JSON.stringify(op)}`);
    console.assert(object_equals(source, a), `source expect ${JSON.stringify(a)}, get ${JSON.stringify(source)}`);
    console.assert(object_equals(target, b), `target expect ${JSON.stringify(b)}, get ${JSON.stringify(target)}`);
    console.log(`test 7: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)} to ${JSON.stringify(target)}`);
}

function test_8() {
    const a = {"a": "value_a"};
    const b = {"a": "value_a", "b": "value_b"};

    const {is_same, path, op, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_ADD_KEYS, `op expect OP_ADD_KEYS, get ${JSON.stringify(op)}`);
    console.assert(object_equals(source, null), `source expect null, get ${JSON.stringify(source)}`);
    console.assert(object_equals(target, {"b": "value_b"}), `target expect {"b": "value_b"}, get ${JSON.stringify(target)}`);
    console.log(`test 8: result is ${is_same}, op is ${op.toString()}, path is ${path}, added ${JSON.stringify(target)}`);
}

function test_9() {
    const a = {"a": "value_a"};
    const b = {};

    const {is_same, path, op, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_REMOVE_KEYS, `op expect OP_REMOVE_KEYS, get ${JSON.stringify(op)}`);
    console.assert(object_equals(source, null), `source expect null, get ${JSON.stringify(source)}`);
    console.assert(object_equals(target, {"a": "value_a"}), `target expect {"a": "value_a"}, get ${JSON.stringify(target)}`);
    console.log(`test 9: result is ${is_same}, op is ${op.toString()}, path is ${path}, removed ${JSON.stringify(target)}`);
}

function test_10() {
    const a = {"a": "value_a"};
    const b = {"b": "value_b", "c": "value_c"};

    const {is_same, path, op, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE_ONE, get ${JSON.stringify(op)}`);
    console.assert(object_equals(source, a), `source expect ${JSON.stringify(a)}, get ${JSON.stringify(source)}`);
    console.assert(object_equals(target, b), `target expect ${JSON.stringify(b)}, get ${JSON.stringify(target)}`);
    console.log(`test 10: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)}, ${JSON.stringify(target)}`);
}

function test_11() {
    const a = {"a": "value_a", "d": "value_d"};
    const b = {"b": "value_b", "c": "value_c"};

    const {is_same, path, op, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE_ONE, get ${JSON.stringify(op)}`);
    console.assert(object_equals(source, a), `source expect ${JSON.stringify(a)}, get ${JSON.stringify(source)}`);
    console.assert(object_equals(target, b), `target expect ${JSON.stringify(b)}, get ${JSON.stringify(target)}`);
    console.log(`test 11: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)}, ${JSON.stringify(target)}`);
}

function test_12() {
    const a = {"root": {"a": "value_a", "d": "value_d"}};
    const b = {"root": {"b": "value_b", "c": "value_c"}};

    const {is_same, path, op, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.["root"].', `path expect '.["root"].', get ${path}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE_ONE, get ${JSON.stringify(op)}`);
    console.assert(object_equals(source, a.root), `source expect ${JSON.stringify(a.root)}, get ${JSON.stringify(source)}`);
    console.assert(object_equals(target, b.root), `target expect ${JSON.stringify(b.root)}, get ${JSON.stringify(target)}`);
    console.log(`test 12: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)}, ${JSON.stringify(target)}`);
}

function test_13() {
    const a = {"root_0": {"a": "value_a", "d": "value_d"}, "a": "value_a"};
    const b = {"root_0": {"b": "value_b", "c": "value_c"}};

    const {is_same, path, op, source, target} = compare(a, b);
    console.assert(is_same === false, `is_same expect false, get ${is_same}`);
    console.assert(path === '.', `path expect '.', get ${path}`);
    console.assert(op === OP_REPLACE, `op expect OP_CHANGE_ONE, get ${JSON.stringify(op)}`);
    console.assert(object_equals(source, a), `source expect ${JSON.stringify(a)}, get ${JSON.stringify(source)}`);
    console.assert(object_equals(target, b), `target expect ${JSON.stringify(b)}, get ${JSON.stringify(target)}`);
    console.log(`test 13: result is ${is_same}, op is ${op.toString()}, path is ${path}, changed from ${JSON.stringify(source)}, ${JSON.stringify(target)}`);
}

test_0();
test_1();
test_2();
test_3();
test_4();
test_5();
test_6();
test_7();
test_8();
test_9();
test_10();
test_11();
test_12();
test_13();