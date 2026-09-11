# Innate CLI 

这个CLI使用go语言实现，用于管理innate-apps中的资源，包括self-host的内容


## Task 1： 构建Innate-Backend SKILL

1. 外部目录中有backend相关的skill和模板脚本
2. ../base/innate-backend 放了backend相关的skill和模板脚本
3.  https://www.verdaccio.org/docs/installation/ 这是一个关于如何使用安装verdaccio的文档
4. 需要实现一个私有的NPM仓库，用于存储innate-apps中的npm包，本地不需要权限或者只要简单权限认证就可以了
5. 使用场景就是：
    1. 如果innate-apps中使用了private仓库的包，需要在innate-cli中配置private仓库的认证信息
    2. 然后在运行这个pnpm dev类似这样的脚本的时候可以一键启动verdaccio，然后也可以一键停止verdaccio
    3. 主要解决的问题就是通过cli方式可以控制从private 仓库拉包和publish到private 仓库

请先分析可行性，可以使用innate-fe-base为例子，实现一个private仓库的认证机制，publish ui相关的包到private仓库
