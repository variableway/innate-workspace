# Setup Project

inante-workspace项目主要是, 这个innate 相关文档的网站, 包括innate 相关的技能, 项目, 参考文档等.
同时包括用AI进行开发的各种自己使用的小工具.

## Task 1. 获取已经存在的项目信息和生成项目registry的脚本

当前项目还需要一个类似于网站的index来处理，在做网站之前先把项目registry生成出来方便之后进行网站构建。
1. 类似scripts/scan.py 这个脚本，不过就是扫描的是innate-apps 目录，生成innate-apps registry， 需要单独的文件生成
2. 其他就是和scan.py 脚本类似