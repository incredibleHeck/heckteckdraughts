####### This section is automatically generated from
#######    /usr/pub/qt-0.98/arch/linux-shared/Makefile

INCDIR	=	
CFLAGS	=	  -O3 -fomit-frame-pointer -malign-double -march=i686
#CFLAGS  = -pg -g -O2
LFLAGS	=	 -lm -lz
#LFLAGS	=	 -pg -lm -lz -lgmon 
CC	=	gcc
DDEFINES=       -DUSE_ZLIB -DWINDOWS -DMAKEDLL

####### End of automatically generated section
#
# $Source: /local/lib/cvs/qt/examples/dclock/Makefile,v $
#

####### Files
OBJECTS=        main.o
DOBJECTS =      util.o var.o movegen.o search.o learn.o PNsearch.o eval.o  book.o index.o database.o patsearch.o mem64.o breakthrough.o
#OBJGEN = generate.o util.c var.o movegen.o index.o database.o mem64.o quiet.o eval.o
OBJGEN = util.o var.o movegen.o search.o learn.o PNsearch.o eval.o  book.o index.o database.o patsearch.o mem64.o breakthrough.o generate.o
TARGET	=	../dragon

# Profiling
# cflags=-pg -O2 -g
# lflags: add -lgmon /usr/lib/gcrt0.o
# $(CC) /usr/lib/gcrt0.o $(DOBJECTS) $(OBJMETA) $(LFLAGS) generate.o -o ../generate  
# start with:
#
# make clean
# make
# execute
# gprof 'program.exe'
#
####### Implicit rules

.SUFFIXES:
.SUFFIXES: .cpp $(SUFFIXES)

.cpp.o:
	$(CC) -c $(CFLAGS) -I$(INCDIR) $<

.c.o:
	$(CC) -c $(CFLAGS) $(DDEFINES) <$
	
####### Build rules

all: $(TARGET)

$(TARGET): $(OBJECTS) $(DOBJECTS) $(OBJMETA)
	$(CC)  $(OBJECTS) $(DOBJECTS) $(OBJMETA) -o $(TARGET) $(LFLAGS)
	cp $(TARGET) /cygdrive/d/programming/dragon/dragon.exe
	
#/usr/lib/gcrt0.o

dll: $(DOBJECTS) $(OBJECTS)
	$(CC) $(OBJECTS) $(DOBJECTS) $(OBJMETA) -mrtd -Wl,--add-stdcall-alias -shared -o ../dragon.dll $(LFLAGS)
    
#generate: $(DOBJECTS) $(OBJMETA) generate.o
generate: $(OBJGEN)
	$(CC) $(OBJGEN) -o ../generate $(LFLAGS)
	cp ../generate.exe /cygdrive/d/programming/dragon
	cp ../generate.exe /cygdrive/g/generate
	

memory: $(OBJMETA) memory.o
	$(CC) $(OBJMETA) memory.o -o ../mem2 $(LFLAGS) 


depend:
	@makedepend -I$(INCDIR) $(SOURCES) 2> /dev/null

showfiles:
	@echo $(SOURCES) $(HEADERS) Makefile

clean:
	-rm -f *.o *.bak *~ *% #*
	-rm -f $(SRCMETA) $(TARGET)

cleandb4:
	rm -f ??v??.raw.gz
	rm -f ?v???.raw.gz
	rm -f ???v?.raw.gz

    
####### Meta objects

main.o: main.c const.h
	$(CC) $(DDEFINES) $(CFLAGS) -c main.c

util.o: util.c const.h var.h
	$(CC) $(DDEFINES) $(CFLAGS) -c util.c

var.o: var.c const.h
	$(CC) $(CFLAGS) -c var.c

movegen.o: movegen.c var.h const.h
	$(CC) $(CFLAGS) -c movegen.c

search.o: search.c var.h const.h
	$(CC) $(DDEFINES) $(CFLAGS) -c search.c

learn.o: learn.c var.h const.h
	$(CC) $(CFLAGS) -c learn.c

PNsearch.o: PNsearch.c var.h const.h
	$(CC) $(CFLAGS) -c PNsearch.c

endgame.o: endgame.c var.h const.h
	$(CC) $(DDEFINES) $(CFLAGS) -c endgame.c -o endgame.o

mem64.o: mem64.c var.h const.h
	$(CC) $(DDEFINES) $(CFLAGS) -c mem64.c -o mem64.o

eval.o: eval.c var.h const.h
	$(CC) $(CFLAGS) $(DDEFINES) -c eval.c

book.o: book.c var.h const.h
	$(CC) $(CFLAGS) -c book.c
	
memory.o: memory.c
	$(CC) $(CFLAGS) -c memory.c

breakthrough.o: breakthrough.c
	$(CC) $(CFLAGS) -c breakthrough.c

patsearch.o: patsearch.c const.h
	$(CC) $(CFLAGS) -c patsearch.c

generator: generator.c var.h const.h util.o var.o
	$(CC) generator.c util.o var.o

var.h: const.h

database.o: database.c var.h const.h
	$(CC) $(DDEFINES) $(CFLAGS) -c database.c

index.o: index.c var.h const.h
	$(CC) $(CFLAGS) -c index.c

generate.o: generate.c
	$(CC) $(CFLAGS) -c generate.c

quiet.o: quiet.c
	$(CC) $(CFLAGS) -c quiet.c

# DO NOT DELETE THIS LINE -- make depend depends on it.

