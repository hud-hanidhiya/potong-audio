#!/bin/bash
# Fake FFmpeg untuk keperluan test sidecar.rs.
# Menerima argumen bergaya FFmpeg asli: -y -i <input> -filter_complex <f>
# -progress pipe:2 [...codec_args] <output_path>
# Output path selalu argumen TERAKHIR (mengikuti build_args() di sidecar.rs).
# Tambahkan "--fail" di mana saja pada argumen untuk mensimulasikan kegagalan.

ARGS=("$@")
OUTPUT_PATH="${ARGS[-1]}"

for arg in "${ARGS[@]}"; do
  if [ "$arg" == "--fail" ]; then
    echo "Error: Invalid data found when processing input" >&2
    exit 1
  fi
done

for pct in 1000000 5000000 10000000; do
  echo "frame=100" >&2
  echo "out_time_us=$pct" >&2
  echo "progress=continue" >&2
  sleep 0.05
done

echo "progress=end" >&2
echo "fake audio content" > "$OUTPUT_PATH"
exit 0
