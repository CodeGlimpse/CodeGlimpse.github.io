---
title: "Python 装了包却无法导入：先确认解释器和 pip"
description: "用两个 Windows 虚拟环境复现 ModuleNotFoundError，定位 python、py 和 pip 指向不同环境的问题。"
slug: python-environment-mismatch
date: 2026-09-09T00:00:00+08:00
categories: [Tutorials]
tags: [Python]
---

`pip install` 显示成功，运行程序却出现 `ModuleNotFoundError`，首先需要回答的是：**安装包和运行程序，用的是同一个 Python 吗？**

下面的例子使用 Windows、Python 3.13.2 和两个独立虚拟环境。重点是找到实际解释器的路径，这个方法也适用于其他 Python 3 版本。

## 先看命令指向哪里

在运行程序的同一个 PowerShell 窗口中执行：

```powershell
Get-Command python, py, pip -All
python --version
python -c "import sys; print(sys.executable); print(sys.prefix); print(sys.base_prefix)"
python -m pip --version
```

`Get-Command` 显示命令解析结果；`sys.executable` 显示真正运行的解释器；`python -m pip` 让这个解释器加载自己的 pip。仅比较版本号不够，同一个版本也可以存在于多个目录。

在本机，`python` 指向 `D:\JDKs\Python3.13\python.exe`，旧版 `py` 启动器的列表同时包含普通版 3.13、自由线程版 3.13t 和 2.7。`py` 的默认条目还是 3.13t。因此，直接输入 `py` 与输入 `python` 并不一定选择同一套运行时。

旧启动器可用 `py --list-paths` 查看条目；新版 Python Install Manager 使用 `py list`。先根据帮助输出判断自己用的是哪一种，再选择明确的版本，例如 `py -3.13`。安装方式见[Python 安装教程]({{< relref "post/python-install" >}})。

## 一次环境错位的实际复现

我在隔离目录创建了 `env-a`、`env-b`，并制作了一个名为 `blog-env-demo` 的本地演示包。它只提供一个字符串，用来验证包安装在哪个环境；**它不是需要你从 PyPI 下载的依赖**。

两个环境都是 Python 3.13，pip 输出也都是 24.3.1，但路径分别落在各自的目录中。下列输出把实验目录统一缩写为 `<实验目录>`：

```text
env-a:
pip 24.3.1 from <实验目录>\env-a\Lib\site-packages\pip (python 3.13)

env-b:
pip 24.3.1 from <实验目录>\env-b\Lib\site-packages\pip (python 3.13)
```

只给 A 安装演示包后，A 可以导入，B 则报错：

```powershell
.\env-a\Scripts\python.exe -c "import blog_env_demo; print(blog_env_demo.MARKER)"
# installed in this interpreter

.\env-b\Scripts\python.exe -c "import blog_env_demo"
# ModuleNotFoundError: No module named 'blog_env_demo'
```

随后，用 **B 自己的解释器**执行 `-m pip`，把同一个本地 wheel 装入 B，B 的导入也成功了。整个过程中没有重装 Python，也没有改全局 PATH。报错来自环境错位。

## 在自己的项目中怎么修正

先确定项目实际使用的解释器。已有 `.venv` 时，可以直接检查它：

```powershell
.\.venv\Scripts\python.exe -c "import sys; print(sys.executable)"
.\.venv\Scripts\python.exe -m pip --version
```

如果这是尚未创建虚拟环境的新项目，再用已安装的目标版本创建环境：

```powershell
py -3.13 -m venv .venv
```

在提供了 `requirements.txt` 的项目中，让安装和运行使用同一路径：

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

将版本号、依赖文件和入口文件替换为项目实际使用的值。IDE、调试器、定时任务也应选同一个解释器。直接调用 `.venv` 中的 Python 不要求先运行激活脚本，因此也不必为此修改 PowerShell 执行策略。

## 路径一致后，还需要检查什么

| 现象 | 下一步 |
| --- | --- |
| 安装名和导入名不同 | 查包的使用文档，例如安装 `Pillow` 后导入的是 `PIL` |
| 报错指向项目内的同名文件 | 检查是否用 `json.py`、`requests.py` 等文件名遮蔽了真正的模块 |
| pip 有包，IDE 仍报错 | 查看 IDE 当前运行配置中的解释器路径，而不只看终端状态 |
| 自由线程版与普通版混用 | 核对运行时及二进制扩展支持情况，不直接复制另一个环境的 `site-packages` |

`sys.prefix != sys.base_prefix` 通常表示当前解释器处于虚拟环境。最终应以实际运行程序的解释器和完整错误为准。

## 参考

- [Python：venv 虚拟环境](https://docs.python.org/3/library/venv.html)
- [Python：Windows 上的 Python](https://docs.python.org/3/using/windows.html)
- [pip：用户指南](https://pip.pypa.io/en/stable/user_guide/)
