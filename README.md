# compare two js object and return difference between them

will return differ path, the operation type and the operation related data (source, target)

# operation types

support five types of operation:

1. REPLACE:

the node of path has been replaced from source to target

2. ADD KEYS:

the node of path is an object and some keys added as target

3. REMOVE KEYS:

the node of path is an object and some keys removed as target

4. TRUNC ELEMENTS:

the node of path is an array and some elements truncated as target

5. APPEND ELEMENTS:

the node of path is an array and some elements appened as target

# path

* seperated by ".".
* if totally different, the path will be "."
