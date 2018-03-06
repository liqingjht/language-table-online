#!/bin/bash
#set -x
occurError()
{
	echo $1
	exit 1
}

if [ "$nodePath" = "" ] || [ "$nodeImg" = "" ] || [ "$nodeLang" = "" ]; then
	occurError "blank param"
fi

folder=$nodePath
img=$nodeImg
lang=$nodeLang

if [ ! -e $folder ] || [ ! -r $img ] || [ ! -r $lang ]; then
	occurError "can not access folder or file"
fi

if [ "${folder:0:6}" != "./tmp/" ]; then
	occurError "folder is not begin ./tmp/"
fi

if [ "${folder:0-1:1}" != "/" ]; then
	folder="$folder/"
fi

cd $folder

rm -rf ./*

if [ "${img##*.}" = "zip" ]; then
	unzip -d ./ "$img"
elif [ "${img##*.}" = "img" ]; then
	cp "$img" ./
fi

cp `find ./ -name "*.img"` ./

shopt -s extglob

rm -rf ./!(*.img)

imgNum=`find ./ -name "*.img" | wc -l`

if [ ${imgNum} != 1 ] ; then
	occurError "multi image files or no image"
fi

imgName=`ls ./ |grep ".img"`

if [ "${lang##*.}" = "zip" ]; then
	unzip -d ./ "$lang"
elif [ "${lang##*.}" = "gz" ]; then
	tar -zxvf "$lang" -C ./
	resultNum=`ls ./ | grep result | wc -l`
	if [ ${resultNum} != 1 ]; then
		occurError "is tar.gz file but not result folder"
	fi
	cp ./result/* ./ -r
	rm -rf ./result
fi

folderNum=`ls -l ./ | egrep "^d" | wc -l`

if [ ${folderNum} != 1 ]; then
	occurError "multi folders or no folder"
fi

infoNum=`find ./ -name "fileinfo.txt" | wc -l`

if [ ${infoNum} != 1 ]; then
	occurError "multi fileinfo files or no fileinfo"
fi

fileinfo=`find ./ -name "fileinfo.txt"`

echo "[[filePath]]:${folder}${fileinfo:2}"

mdinfo=`md5sum ./*.img |awk '{print toupper($1)}'`

size=`ls -l ./*.img |awk '{print $5}'`

name=`ls ./ | grep ".img"`

echo "[[imgPath]]:${folder}${name}"

version=`echo $name | egrep '\-v([0-9]{1,3}\.){3}[0-9]{1,3}.*.img' -i -o`

project=`echo ${name%$(echo $version)*}`

#project=`echo ${project#$(echo $folder)*}`

version=`echo $version | sed s/.img$/""/ | sed s/^-V/"V"/ | sed s/^-v/"V"/`

major=`echo ${version:0:2}`

major=`echo ${major:1:1}`

isUTF16=`file $fileinfo |grep -c UTF-16`

if [ $isUTF16 -eq 1 ]; then
	iconv -f UTF-16 -t UTF-8 $fileinfo -o $fileinfo
fi

sed -i "1s/\[Major.*\]/\[Major$major\]/" $fileinfo

sed -i "2s/file=.*/file=$imgName/" $fileinfo

sed -i "3s/md5=.*/md5=$mdinfo/" $fileinfo

sed -i "4s/size=.*/size=$size/" $fileinfo

cat $fileinfo |tr -d '\r' > ./fileinfoTmp.txt

mv ./fileinfoTmp.txt $fileinfo

cp $fileinfo $fileinfo-utf8

iconv -f UTF-8 -t UTF-16 $fileinfo -o $fileinfo

if [ -r stringtable.dat ]; then
	sIsUTF16=`file stringtable.dat |grep -c UTF-16`
	if [ $sIsUTF16 -eq 0 ]; then
		iconv -f UTF-8 -t UTF-16 stringtable.dat -o stringtable.dat
	fi
fi

langVersion="`find ./ -name "*Eng-Language-table" | egrep 'v([0-9]{1,3}\.){3}[0-9]{1,3}' -i -o |head -1`"

if [ $langVersion = "" ]; then
	occurError "can not find language version from fileinfo"
fi

echo "---fileinfo begin---"

cat $fileinfo-utf8 | head -4

echo "---fileinfo end---"

rm -f $fileinfo-utf8

zipName=`echo "${project}-language-table-${langVersion}-for-FW-${version}.zip"`

zipFolder=`ls -l ./ | egrep "^d" | awk '{print $9}'`

cd ./${zipFolder}

zip ${zipName} -r -D ./*

mv ./$zipName ../

echo "[[zipPath]]:${folder}${zipName}"

exit 0
