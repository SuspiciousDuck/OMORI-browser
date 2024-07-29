if [ $# -eq 0 ]; then
	echo "please pass the path to your OMORI root folder (decrypted) *without leading slash*"
	exit 1
fi

maps=(`find $1/www/maps/ -name "map*.json" -type f | xargs echo`)

for map in ${maps[@]}; do
	sources=(`grep "\"source\" : \"" ${map} | xargs echo | sed 's#source : ##g'`)
	replacements=()
	missing=()
	for src in ${sources[@]}; do
		find $1/www -name ${src} -type f -print0 | grep -z . > /dev/null
		if [ $? -eq 0 ]; then
			continue
		fi
		replacements+=(`find $1/www -type f | grep ${src} -i | xargs basename`)
		missing+=(${src})
	done
	if [ ${#missing[@]} -ne 0 ]; then
		echo $map
	fi
	for index in ${!replacements[@]}; do
		echo ${missing[$index]} ">" ${replacements[$index]}
		bash -c "sed -i 's#\"source\" : \"${missing[$index]}\"#\"source\" : \"${replacements[$index]}\"#g' ${map}"
	done
	if [ ${#missing[@]} -ne 0 ]; then
		printf "\n"
	fi
done
