default: all

all:
	cd lua && make generic
	cd src && make

clean:
	cd lua && make clean
	cd src && make clean
