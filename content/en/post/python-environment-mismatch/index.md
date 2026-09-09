---
title: "Installed a Python package but cannot import it? Check the interpreter"
description: "Reproduce ModuleNotFoundError with two Windows virtual environments and trace mismatched python, py, and pip commands."
slug: python-environment-mismatch
date: 2026-09-09T00:00:00+08:00
categories: [Tutorials]
tags: [Python]
---

When `pip install` succeeds but a program raises `ModuleNotFoundError`, first check whether **installation and execution use the same Python interpreter**.

This example uses Windows, Python 3.13.2, and two isolated virtual environments. The useful evidence is the interpreter path; the same approach applies to other Python 3 versions.

## Identify the commands you are running

Run these commands in the same PowerShell window that launches the program:

```powershell
Get-Command python, py, pip -All
python --version
python -c "import sys; print(sys.executable); print(sys.prefix); print(sys.base_prefix)"
python -m pip --version
```

`Get-Command` shows command resolution, `sys.executable` identifies the running interpreter, and `python -m pip` loads pip through that interpreter. Matching version numbers are insufficient: several directories can contain the same Python version.

On this machine, `python` resolves to `D:\JDKs\Python3.13\python.exe`. The legacy `py` launcher lists regular 3.13, free-threaded 3.13t, and 2.7; its default entry is 3.13t. Thus `py` and `python` can choose different runtimes.

The legacy launcher supports `py --list-paths`; the newer Python Install Manager uses `py list`. Check the help output to identify your launcher, then select an explicit version such as `py -3.13`. See the [Python installation guide]({{< relref "post/python-install" >}}) for installation options.

## Reproducing an environment mismatch

I created `env-a` and `env-b` in an isolated directory and built a local demonstration package named `blog-env-demo`. It exposes a string to identify a successful import. **It is not a dependency you need to download from PyPI.**

Both environments run Python 3.13 and report pip 24.3.1, but pip lives in different directories. The experiment directory is abbreviated below:

```text
env-a:
pip 24.3.1 from <experiment>\env-a\Lib\site-packages\pip (python 3.13)

env-b:
pip 24.3.1 from <experiment>\env-b\Lib\site-packages\pip (python 3.13)
```

After installing the local wheel only in A, the import succeeds in A and fails in B:

```powershell
.\env-a\Scripts\python.exe -c "import blog_env_demo; print(blog_env_demo.MARKER)"
# installed in this interpreter

.\env-b\Scripts\python.exe -c "import blog_env_demo"
# ModuleNotFoundError: No module named 'blog_env_demo'
```

Installing that same wheel through **B's interpreter with `-m pip`** makes the import succeed in B too. No Python reinstallation or global PATH change was needed. The failure was an environment mismatch.

## Apply the fix to your project

If a project already has a `.venv`, inspect it directly:

```powershell
.\.venv\Scripts\python.exe -c "import sys; print(sys.executable)"
.\.venv\Scripts\python.exe -m pip --version
```

For a new project without an environment, create one with an installed target version:

```powershell
py -3.13 -m venv .venv
```

For a project that supplies `requirements.txt`, use the same interpreter for installation and execution:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Substitute the project's actual Python version, dependency file, and entry point. Configure the IDE, debugger, or scheduled task to use that interpreter too. Calling the executable directly does not require activation or a PowerShell execution-policy change.

## If the paths already match

| Symptom | Next check |
| --- | --- |
| Distribution and import names differ | Consult the package documentation: `Pillow`, for example, is imported as `PIL` |
| The traceback points to a local file | Look for files such as `json.py` or `requests.py` that shadow another module |
| pip lists the package but the IDE fails | Inspect the interpreter in the actual run configuration |
| Regular and free-threaded builds are mixed | Check runtime and binary-extension compatibility; do not copy another environment's `site-packages` |

`sys.prefix != sys.base_prefix` normally indicates a virtual environment. Diagnose the interpreter that actually runs the program and retain the complete error message.

## References

- [Python: venv](https://docs.python.org/3/library/venv.html)
- [Using Python on Windows](https://docs.python.org/3/using/windows.html)
- [pip user guide](https://pip.pypa.io/en/stable/user_guide/)
