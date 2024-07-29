if [ $# -eq 0 ]; then
        echo "please pass the path to your OMORI root folder (decrypted) *without leading slash*"
        exit 1
fi
IFS=$'\n'
src=(`find $1/www/js/ -name "*.js" -type f`)
jason=(`find $1/www/ -name "*.json" -type f`)
yamul=(`find $1/www/ -name "*.yaml" -type f`)

echo "This can't be undone unless you have a backup"
echo "Continuing in 5 seconds"
sleep 5;

echo "Minifying Javascript files..."
for js in ${src[@]}; do
	echo $(basename $js)
	uglifyjs ${js} > ${js}
done

echo "Minifying JSON files..."
for json in ${jason[@]}; do
	echo $(basename $json)
	jq --compact-output < ${json} > ${json}
done

echo "Minifying YAML files..."
for yaml in ${yamul[@]}; do
	echo $(basename $yaml)
	yq --compact-output < $yaml > ${json}
done
