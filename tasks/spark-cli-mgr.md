# Spark Cli 功能优化

## Task 1:  管理github 仓库的submodule

背景和解决的内容:
1.  当前一个目录内可能会包含很多的github 仓库，但是github 仓库不想作为submodule管理
2. 需要一个脚本来扫描指定目录下的所有github 仓库，将这些仓库添保存到一个registry文件
3. 参考实现是当前项目中的scripts/ 目录下的实现，python的实现，把这个实现变成spark-cli的一个subcommand
4.  这个subcommand是： spark-cli repo 
- scan <folder_name> to save it into a registry_<folder_name>.yaml file
- clone  -r <repo_name> -f registry_<folder_name>.yaml file to clone the repositories into the <folder_name> directory
- list -f registry_<folder_name>.yaml file to list the repositories in the registry file

5. spark-cli code is ~/workspace/variableway/innate-workspace/innate-apps/tooling/spark-cli
6. 修改之后需要补充BDD 测试用例和文档
