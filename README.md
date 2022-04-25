# compare source object(array) and target object(array)

will return differ path, the operation and the operation related data

# result types

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

seperated by ".", if the whole object is different, the path will be "."
