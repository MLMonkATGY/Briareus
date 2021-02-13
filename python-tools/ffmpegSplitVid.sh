#!/bin/bash
ffmpeg -hwaccel cuda -i output001.mp4 -s 224x224 -vf fps=1  out1_%d.jpg &
ffmpeg -hwaccel cuda -i output002.mp4 -s 224x224 -vf fps=1  out2_%d.jpg &
ffmpeg -hwaccel cuda -i output003.mp4 -s 224x224 -vf fps=1  out3_%d.jpg &
ffmpeg -hwaccel cuda -i output004.mp4 -s 224x224 -vf fps=1  out4_%d.jpg &
ffmpeg -hwaccel cuda -i output005.mp4 -s 224x224 -vf fps=1  out5_%d.jpg &
ffmpeg -hwaccel cuda -i output006.mp4 -s 224x224 -vf fps=1  out6_%d.jpg &
ffmpeg -hwaccel cuda -i output007.mp4 -s 224x224 -vf fps=1  out7_%d.jpg &
ffmpeg -hwaccel cuda -i output008.mp4 -s 224x224 -vf fps=1  out8_%d.jpg &
ffmpeg -hwaccel cuda -i output009.mp4 -s 224x224 -vf fps=1  out9_%d.jpg &
ffmpeg -hwaccel cuda -i output010.mp4 -s 224x224 -vf fps=1  out10_%d.jpg &
ffmpeg -hwaccel cuda -i output007.mp4 -s 224x224 -vf fps=1  out7_%d.jpg &
ffmpeg -hwaccel cuda -i output008.mp4 -s 224x224 -vf fps=1  out8_%d.jpg &
ffmpeg -hwaccel cuda -i output009.mp4 -s 224x224 -vf fps=1  out9_%d.jpg &
ffmpeg -hwaccel cuda -i output010.mp4 -s 224x224 -vf fps=1  out10_%d.jpg &

ffmpeg -hwaccel cuda -i output011.mp4 -s 224x224 -vf fps=1  out11_%d.jpg &
ffmpeg -hwaccel cuda -i output012.mp4 -s 224x224 -vf fps=1  out12_%d.jpg &
ffmpeg -hwaccel cuda -i output013.mp4 -s 224x224 -vf fps=1  out13_%d.jpg &
ffmpeg -hwaccel cuda -i output014.mp4 -s 224x224 -vf fps=1  out14_%d.jpg &

