#!/usr/bin/env python3
"""sigrun.py <segundos> <SINAL> <cmd...> — roda cmd em primeiro plano (SIGINT no
padrão, como num terminal), envia o sinal após N segundos e sai com o código do
comando. Mata o grupo inteiro se o comando não terminar em 10s após o sinal."""
import os
import signal
import subprocess
import sys

delay, signame, cmd = float(sys.argv[1]), sys.argv[2], sys.argv[3:]

def child():
    os.setsid()
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    signal.signal(signal.SIGTERM, signal.SIG_DFL)

# preexec_fn é seguro aqui: processo de thread única, só reconfigura sinais do filho
proc = subprocess.Popen(cmd, preexec_fn=child)  # noqa: PLW1509
try:
    sys.exit(proc.wait(timeout=delay))
except subprocess.TimeoutExpired:
    pass
os.killpg(proc.pid, getattr(signal, "SIG" + signame))
try:
    rc = proc.wait(timeout=10)
except subprocess.TimeoutExpired:
    os.killpg(proc.pid, signal.SIGKILL)
    proc.wait()
    print("sigrun: comando ignorou o sinal; morto com SIGKILL", file=sys.stderr)
    sys.exit(99)
sys.exit(128 - rc if rc < 0 else rc)
