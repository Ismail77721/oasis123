#!/usr/bin/env python3
"""Create original, purely synthesized environmental and mechanical SFX.
No third-party audio samples, animal calls, speech, songs, or musical sequences.
Needs numpy, scipy and ffmpeg. Deterministic output from fixed random seed.
"""
from pathlib import Path
import subprocess
import tempfile
import wave
import numpy as np
from scipy.signal import butter, sosfilt

RATE = 24000
RNG = np.random.default_rng(20261101)
DEST = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
DEST.mkdir(parents=True, exist_ok=True)

def lp(x, hz):
    return sosfilt(butter(3, hz, fs=RATE, output='sos'), x)

def hp(x, hz):
    return sosfilt(butter(2, hz, fs=RATE, btype='highpass', output='sos'), x)

def noise(n):
    return RNG.standard_normal(n)

def envelope(n, attack=.025, release=.12):
    e = np.ones(n)
    a, r = min(n, int(RATE*attack)), min(n, int(RATE*release))
    if a: e[:a] = np.sin(np.linspace(0, np.pi/2, a))**2
    if r: e[-r:] = np.cos(np.linspace(0, np.pi/2, r))**2
    return e

def pulse(out, time, length, freq, amp=.8, decay=18, noise_amt=.2):
    i = int(time * RATE)
    n = min(int(length * RATE), len(out)-i)
    if n <= 0:return
    t=np.arange(n)/RATE
    phase=2*np.pi*(freq*t+freq*.018*t*t)
    sig=(np.sin(phase)+.3*np.sin(phase*2.17)) * np.exp(-decay*t)
    if noise_amt: sig+=noise_amt*noise(n)*np.exp(-decay*1.4*t)
    out[i:i+n]+=amp*sig

def fade_loop(x, secs=.38):
    n=min(int(RATE*secs),len(x)//3)
    # Cross-splice the beginnings and ends into a periodic signal.
    # Additive fades on overlapping portions make the encoded wrap unobtrusive.
    a=x[:n].copy(); b=x[-n:].copy()
    blend=np.linspace(0,1,n)
    merged=a*blend+b*(1-blend)
    x[:n]=merged; x[-n:]=merged
    return x

def wind():
    n=RATE*14;t=np.arange(n)/RATE
    raw=lp(noise(n),2100)*.43+lp(noise(n),230)*1.0
    sweep=.55+.17*np.sin(2*np.pi*t/5.6)+.13*np.sin(2*np.pi*t/8.4+1.2)
    shhh=lp(hp(noise(n),600),3500)*.11*(.65+.3*np.sin(2*np.pi*t/4.8)**2)
    return fade_loop((raw*sweep+shhh)*.73)

def water_brook():
    n=RATE*14;t=np.arange(n)/RATE
    hiss=lp(hp(noise(n),380),5800)*.47
    low=lp(noise(n),290)*.5
    flow=.66+.11*np.sin(t*.8)+.11*np.sin(t*2.1+1)
    arr=(hiss+low)*flow
    for j in range(100):
        when=float(RNG.uniform(.3,13.7)); freq=float(RNG.uniform(240,840))
        pulse(arr,when,float(RNG.uniform(.022,.076)),freq,amp=.13,decay=float(RNG.uniform(35,95)),noise_amt=.07)
    return fade_loop(arr*.86)

def dry_grit(length=.46, smooth=950, grit=1):
    n=int(RATE*length);t=np.arange(n)/RATE
    raw=hp(lp(noise(n),smooth),170)
    flutter=(np.abs(np.sin(t*38))+np.abs(np.sin(t*61+1)))*.55+.15
    return raw*flutter*envelope(n,.012,.17)*grit

def planting():
    n=int(RATE*.62);a=np.zeros(n)
    for pos in [.0,.13,.31]:
        k=int(pos*RATE);x=dry_grit(.28,1900,.47)
        a[k:min(k+len(x),n)]+=x[:min(len(x),n-k)]
    return a

def watering():
    n=int(RATE*1.35);t=np.arange(n)/RATE
    a=lp(hp(noise(n),520),5800)*(.4+.1*np.sin(t*32))
    for j in range(22):pulse(a,float(RNG.uniform(.10,1.18)),.075,float(RNG.uniform(350,980)),.15,decay=47,noise_amt=.11)
    return a*envelope(n,.09,.28)

def leaves():
    n=int(RATE*.74);t=np.arange(n)/RATE
    a=lp(hp(noise(n),1000),7900)*(.3+.4*np.abs(np.sin(t*27)))
    for j in range(4):
        x=dry_grit(.26,3200,.25);k=int((j*.13)*RATE)
        a[k:min(k+len(x),n)]+=x[:min(len(x),n-k)]
    return a*envelope(n,.025,.22)

def stone_taps():
    a=np.zeros(int(RATE*.95))
    for i,pos in enumerate([.03,.31,.60]):pulse(a,pos,.18,[194,161,223][i],.65,28,noise_amt=.7)
    return a*envelope(len(a),.012,.18)

def canal_tools():
    a=dry_grit(.85,1200,.7)
    for pos in [.09,.32,.56]:pulse(a,pos,.14,180,.32,27,.65)
    return a*envelope(len(a),.014,.15)

def coin_clinks():
    a=np.zeros(int(RATE*.78))
    for i,pos in enumerate([.025,.20,.40,.53]):
        k=int(pos*RATE);n=min(int(.20*RATE),len(a)-k)
        t=np.arange(n)/RATE
        # Metal resonances are intentionally inharmonic, not musical notes.
        a[k:k+n]+=(np.sin(2*np.pi*(1120+i*57)*t)*.39+np.sin(2*np.pi*(1743+i*41)*t)*.23+noise(n)*.04)*np.exp(-29*t)
    return a*envelope(len(a),.002,.14)

def soft_click():
    a=np.zeros(int(RATE*.16));pulse(a,.006,.11,395,.45,63,noise_amt=.65)
    return a*envelope(len(a),.002,.065)

def upgrade_tools():
    a=np.zeros(int(RATE*.86))
    for i,pos in enumerate([.015,.25,.44]):pulse(a,pos,.23,260+i*125,.51,19,.36)
    return a*envelope(len(a),.004,.15)

def collect_sack():
    a=leaves()*.66
    for pos in [.04,.29]:pulse(a,pos,.11,245,.27,40,.6)
    return a

def dull_error():
    a=np.zeros(int(RATE*.31));pulse(a,.02,.23,105,.45,18,.1)
    return a*envelope(len(a),.008,.12)

def quest_paper():
    a=np.zeros(int(RATE*.84));a[:int(RATE*.65)]=dry_grit(.65,2100,.58)
    for pos in [.11,.46]:pulse(a,pos,.12,350,.32,50,.5)
    return a*envelope(len(a),.012,.14)

SOFT={
    'wind':wind,'water_ambience':water_brook,
    'plant':planting,'water':watering,'harvest':leaves,
    'build':stone_taps,'canal':canal_tools,'coin':coin_clinks,
    'click':soft_click,'upgrade':upgrade_tools,'collect':collect_sack,
    'error':dull_error,'quest':quest_paper
}

def export(name,x):
    # Scale without aggressive compression; peaks are hard-limited below clipping.
    x=np.nan_to_num(np.asarray(x,float))
    peak=max(float(np.max(np.abs(x))),1e-10)
    x=np.tanh(x*min(.88/peak,2.5))*1.2
    peak=max(float(np.max(np.abs(x))),1e-10)
    x=np.clip(x*.91/peak,-.95,.95)
    pcm=np.asarray(x*32767,dtype='<i2')
    with tempfile.TemporaryDirectory() as temp:
        wav=Path(temp)/(name+'.wav')
        with wave.open(str(wav),'wb') as f:
            f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(pcm.tobytes())
        path=DEST/(name+'.mp3')
        subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-i',str(wav),'-ac','1','-ar','24000','-b:a','56k',str(path)],check=True)
    print(name,'%.2fs'%(len(x)/RATE),str(path.stat().st_size)+' bytes')

if __name__=='__main__':
    for key,fn in SOFT.items():export(key,fn())
