# compare source object(array) and target object(array)

will return differ path, the operation and the operation related data

# result types

support five types of operation from source to target:

1. REPLACE:

the node of path has been replaced

2. ADD KEYS:

the node of path is an object and some keys added

3. REMOVE KEYS:

the node of path is an object and some keys removed

4. TRUNC ELEMENTS:

the node of path is an array and some elements truncated

5. APPEND ELEMENTS:

the node of path is an array and some elements appened

# path

seperated by ".", if the whole object is different, the path will be "."
